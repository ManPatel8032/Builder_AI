
// POST /api/projects
// Create a new project from an AI prompt

import { Project } from "../models/project.js";
import crypto from 'crypto';

function hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 12);
}

export async function createProject(req, res) {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: "Prompt is required and must be a string" })
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return;
    }

    // Create project in DB with pending status
    const project = await Project.create({
        name: "Planning project...",
        description: prompt,
        files: {},
        messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: 'Planning project structure...' }
        ],
        version: 0,
        owner: req.user.userId,
        status: "pending",
        filesPlanned: [],
        filesGenerated: [],
        currentFile: null,
        error: null,
    });

    runBackgroundGeneration(project._id.toString(), prompt).catch((err) => {
        console.error(`[Background AI] Fatal generation error for project ${project._id}`, err)
    })

    res.status(201).json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: {},
        messages: project.messages,
        version: project.version,
        status: project.status,
        filesPlanned: project.filesPlanned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
    })
}

// background worker to progressive generate files and update database in real time
async function runBackgroundGeneration(projectId, prompt) {

}

// GET /api/projects
// Get all projects for current user
export async function listProjects(req, res) {
    if(!req.user){
        res.status(401).json({ error: "Unauthorized" })
        return;
    }

    const projects = await Project.find({ owner: req.user.userId },
        {name: 1, description: 1, status: 1, createdAt: 1, updatedAt: 1}
    ).sort({ updatedAt: -1 }).lean();

    res.json(projects);
}

// GET /api/projects/:id
// Get a single project details by ID
export async function getProject(req, res) {
    if(!req.user){
        res.status(401).json({ error: "Unauthorized" })
        return;
    }

    const project = await Project.findOne({_id: req.params.id, owner: req.user.userId})

    if(!project){
        res.status(404).json({error: "Project not found"});
        return;
    }

    const filesObj = {}
    for(const [path, entry] of Object.entries(project.files || {})){
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
        filesPlanned: project.filesPlanned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
        updatedAt:project.updatedAt
    })
}

// DELETE /api/projects/:id
// Delete a project
export async function deleteProject(req, res) {
    if(!req.user){
        res.status(401).json({ error: "Unauthorized" })
        return;
    }

    const result = await Project.findOneAndDelete({_id: req.params.id,
        owner: req.user.userId
    })

    if(!result){
        res.status(404).json({error: "Project not found"});
        return;
    }

    res.json({success: true})
}

// PUT /api/project/:id/files
// Update project files (manual edits).
export async function updateProjectFiles(req, res) {
    const { files } = req.body;
    if(!files || typeof files !== 'object') {
        res.status(400).json({ error: "Files is required and must be an object" })
        return;
    }

    if(!req.user){
        res.status(401).json({ error: "Unauthorized" })
        return;
    }

    const project = await Project.findOne({_id: req.params.id, owner: req.user.userId})

    if(!project){
        res.status(404).json({error: "Project not found"});
        return;
    }

    // Rebuild the files object with content & hashes
    const newFiles = {}
    for(const [path, content] of Object.entries(files)){
        if(typeof content === 'string'){
            newFiles[path] = {
                content,
                hash: hashContent(content)
            }
        }
    }

    project.files = newFiles;
    await project.save();

    const filesObj = {};
    for(const [path, entry] of Object.entries(project.files || {})){
        filesObj[path] = entry?.content ?? entry;
    }

    res.json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        messages: project.messages,
        version: project.version,
        createdAt: project.createdAt,
        updatedAt:project.updatedAt
    })
}

// PUT /api/project/:id/publish
// mark a project as publicly published
export async function publishProject(req, res) {
    if(!req.user){
        res.status(401).json({ error: "Unauthorized" })
        return;
    }

    const project = await Project.findOneAndUpdate({_id: req.params.id, owner: req.user.userId},
        { published: true },
        { new: true, returnDocument: 'after' }
    );

    if(!project){
        res.status(404).json({error: "Project not found"});
        return;
    }

    res.json({
        success: true,
        project: project.published
    });
}

// GET /api/public/projects/:id
// GET public project details
export async function getPublicProject(req, res) {
    const project = await Project.findById(req.params.id);
    if(!project)
    {
        res.status(404).json({error: "Project not found"});
        return;
    }

    if(!project.published){
        res.status(403).json({error: "Project is not published"});
        return;
    }

    const filesObj = {}
    for(const [path, entry] of Object.entries(project.files || {})){
        filesObj[path] = entry?.content ?? entry;
    }

    res.json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        version: project.version,
    });
}




