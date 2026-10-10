import {Router} from "express";
import { getPublicProject, createProject, listProjects, getProject, deleteProject, updateProjectFiles, publishProject} from "../controllers/projectController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const ProjectRouter = Router();

// Public route
ProjectRouter.get('/public/:id', getPublicProject);

ProjectRouter.use(authMiddleware); // Apply authentication middleware to all routes below

ProjectRouter.post('/', createProject);
ProjectRouter.get('/', listProjects);
ProjectRouter.get('/:id', getProject);
ProjectRouter.delete('/:id', deleteProject);
ProjectRouter.put('/:id', updateProjectFiles);
ProjectRouter.put('/:id/files', updateProjectFiles);
ProjectRouter.post('/:id/publish', publishProject);

export default ProjectRouter;
