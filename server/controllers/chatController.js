// POST /api/projects/:id/chat
//send a revision prmpt and return uupdated project

import { Project } from "../models/project.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations } from "../services/diff.js";


export function buildManifest(files){
    const manifest = [];
    for (const [path, entry] of Object.entries(files || {})){
        manifest.push({
            path,
            hash: entry?.hash,
            size: entry?.content ? entry.content.length : 0
        });
    }
    return manifest;
}

export async function chat(req, res){
    const { prompt } = req.body;

    if(!prompt || typeof prompt !== "string"){
        res.status(400).json({ error: "prompt is required"});
        return;
    }

    if(!req.user){
        res.status(401).json({error: "Unauthorized"});
        return;
    }

    const project = await Project.findOne({
        _id : req.params.id,
        owner: req.user.userId
    });

    if(!project){
        res.status(404).json({ error: "Project not found" });
        return;
    }

    project.status = "revising";
    project.messages.push({
        role: "user", 
        content: prompt,
        timestamp: new Date()
    });
    await project.save();

    try {
        // Build compact manifest
        
        const manifest = buildManifest(project.files);

        // Include all files content

        const relevantFiles = {};
        for (const [path, entry] of Object.entries(project.files || {})){
            relevantFiles[path] = entry?.content ?? entry;
        }   

        // Recent messages for content

        const recentMessages = project.messages.slice(-4).map((m) =>({
            role: m.role,
            content: m.content,
        }));

        console.log("AI Revising project ",     project.name, prompt.slice(0,80), manifest.length, JSON.stringify(manifest).length);

        const result = await reviseProject(prompt, manifest, relevantFiles, recentMessages)

        console.log(`[AI] Got ${result.operations.length} operations: ${result.description}`);

        // apply ops to file map

        const { files: updatedFiles, applied, errors } = applyOperations(
            project.files, result.operations
        )

        if(errors.length > 0){
            console.warn(`[Diff] Errors applying operations`, errors);
        }

        project.files = updatedFiles;
        project.markModified("files");
        project.version += 1;
        project.status = "completed";
        project.messages.push({
            role: "assistant",
            content: result.description + (errors.length > 0 ? `\n\n Some operations failed. Please check the errors above. `: ""),
        })
        await project.save();

        // update project files
        const filesObj = {};
         for (const [path, entry] of Object.entries(project.files || {})) {
            filesObj[path] = entry?.content ?? entry;
         }

        res.json({
            _id: project._id,
            name: project.name,
            description: project.description,
            files: filesObj,
            messages: project.messages,
            version: project.version,
            status: project.status,
            applied,
            errors,
            aiDescription: result.description, 
        })
        
    } catch (err) {
        console.error(`[AI Revision Error] ${err.message}` );
        project. status = "completed";
        await project. save();
        res. status (500) . json({ error: err.message || "Failed to process"});
    }
}

