import { errorHandler } from "../config/errorHandler.js";
import Project from '../models/project.model.js';
import Task from "../models/task.model.js";
export const createProject = async (req, res, next) => {
    const { projectName, projectDesc } = req.body;
    let creatorId;
    if (!req.user) {
        throw new Error('unauthorized to create a project');
    }
    creatorId = req.user.id;
    if (!projectName) {
        return next(errorHandler(401, "project name is "));
    }
    try {
        const newProject = new Project({
            projectName: projectName,
            projectDesc: projectDesc,
            creator: creatorId,
            members: [creatorId]
        });
        await newProject.save();
        res.status(200).json('Project successfully created');
    }
    catch (error) {
        next(error);
    }
};
export const updateProject = async (req, res, next) => {
    const { projectName, projectDesc } = req.body;
    try {
        await Project.findByIdAndUpdate(req.params.projectId, {
            $set: {
                projectName: projectName,
                projectDesc: projectDesc
            }
        }, { new: true });
        res.status(200).json('Project successfully updated');
    }
    catch (error) {
        next(error);
    }
};
export const deleteProject = async (req, res, next) => {
    const projectId = req.params.projectId;
    try {
        const deleteTaskes = await Task.deleteMany({ projectId: projectId }); //i delete all taskes where projectId is equal to req.params.projectId
        if (deleteTaskes) {
            const deleteTheProject = await Project.findByIdAndDelete(projectId);
            if (deleteTheProject) {
                res.status(200).json("Project successfuly deleted!");
            }
        }
    }
    catch (error) {
        next(error);
    }
};
export const getAllProjectCreated = async (req, res, next) => {
    if (!req.user) {
        throw new Error("unauthorized");
    }
    const creatorId = req.user.id;
    try {
        const rawStart = req.query.startIndex;
        const startIndex = typeof rawStart === 'string' && !isNaN(Number(rawStart))
            ? parseInt(rawStart, 10)
            : 0;
        const sortDirection = req.query.order === 'asc' ? 1 : -1;
        const projectCreated = await Project.find({
            creator: creatorId, //I put it for just have projets that the user had created
            ...(req.query.projectId && { _id: req.query.projectId }),
            ...(req.query.searchTerm && {
                $or: [
                    { projectName: { $regex: req.query.searchTerm, $options: 'i' } }, //$options: 'i' we put this for ignoring the casse
                    { projectDesc: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        }).sort({ updatedAt: sortDirection }).skip(startIndex).populate("creator members", "firstName lastName");
        const projectParticipated = await Project.find({
            members: creatorId, //find projects where l'm a member
            creator: { $ne: creatorId }, //find projects where l'm not the creator
            ...(req.query.projectId && { _id: req.query.projectId }),
            ...(req.query.searchTerm && {
                $or: [
                    { projectName: { $regex: req.query.searchTerm, $options: 'i' } },
                    { projectDesc: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        }).populate("creator members", "firstName lastName");
        const totalProjectsCreated = await Project.countDocuments({ creator: creatorId }); //total projects that the user had created
        const totalProjectMembered = await Project.countDocuments({ members: creatorId }); //total projects that the user had joinded
        res.status(200).json({
            projectCreated,
            projectParticipated,
            totalProjectsCreated,
            totalProjectMembered
        });
    }
    catch (error) {
        next(error);
    }
};
export const getTheProject = async (req, res, next) => {
    const projectId = req.params.projectId;
    try {
        const theProject = await Project.findById({ _id: projectId }).populate("creator members", "_id firstName lastName email image");
        if (!theProject) {
            return next(errorHandler(404, "Project not found"));
        }
        res.status(200).json(theProject);
    }
    catch (error) {
        next(error);
    }
};
export const addMember = async (req, res, next) => {
    const { userId } = req.body; //userId is the id of the user that we want to add in the project
    const projectId = req.params.projectId; //projectId is the id of the project where we want to add the user
    if (!req.user) {
        throw new Error('unauthorized to add a member');
    }
    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return next(errorHandler(404, "Project not found"));
        }
        if (project.creator.toString() !== req.user.id) {
            return next(errorHandler(403, "you are not allowed to add a member"));
        }
        if (project.members.includes(userId)) { //if the user is already a member of the project
            return next(errorHandler(400, "User is already a member of the project"));
        }
        project.members.push(userId);
        await project.save();
        res.status(200).json("Member successfully added");
    }
    catch (error) {
        next(error);
    }
};
export const deleteMember = async (req, res, next) => {
    const userId = req.params.memberId; //userId is the id of the user that we want to delete from the project
    const projectId = req.params.projectId; //projectId is the id of the project where we want to delete the user
    if (!req.user) {
        throw new Error('unauthorized to delete a member');
    }
    try {
        const updateProject = await Project.findByIdAndUpdate(projectId, {
            $pull: { members: userId }
        }, { new: true });
        if (updateProject) {
            res.status(200).json("Member successfully deleted");
        }
    }
    catch (error) {
        next(error);
    }
};
