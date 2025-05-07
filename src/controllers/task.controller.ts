import { errorHandler } from "../config/errorHandler.js";
import Project from "../models/project.model.js";
import Task from "../models/task.model.js"
import { Request, Response, NextFunction } from "express"
import { Types } from "mongoose";

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    const { taskName, taskDesc, status, projectId, deadline } = req.body;
    if (!req.user) {
        throw new Error('unauthorized to create a task');
    }
    const userId = req.user.id;

    if (!taskName) {
        return next(errorHandler(400, "task name is required"));
    }
    if (!projectId || projectId === "" || projectId === undefined || projectId === null) {
        return next(errorHandler(400, "you should assign a project to this task"));
    }

    try {
        const newTask = new Task({
            taskName: taskName,
            taskDesc: taskDesc,
            status: status,
            assignedTo: userId,
            projectId: projectId,
            deadline: deadline
        })
        await newTask.save();

        res.status(200).json("Task created successfuly");
    } catch (error) {
        next(error)
    }
}

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    const { taskName, taskDesc, status, projectId, deadLine } = req.body
    const taskId = req.params.taskId;
    try {
        const updatedTask = await Task.findByIdAndUpdate({ _id: taskId }, {
            $set: {
                taskName, taskDesc, status, projectId, deadLine
            }
        },
            { new: true });
        if (updatedTask) {
            res.status(200).json("Task updated successfuly")
        }
    } catch (error) {
        next(error)
    }
}

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    const taskId = req.params.taskId;
    try {
        const deleteTask = await Task.findByIdAndDelete(taskId);
        if (deleteTask) {
            res.status(200).json("Task deleted successfuly")
        }
    } catch (error) {
        next(error)
    }
}

export const getAllTask = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new Error('unauthorized to get all tasks');
    }
    const creatorId = req.user.id; //because I want to take all tasks that the user had created
    try {
        const rawStart = req.query.startIndex;
        const startIndex = typeof rawStart === 'string' && !isNaN(Number(rawStart))
            ? parseInt(rawStart, 10)
            : 0;
        const rawEnd = req.query.endIndex;
        const endIndex = typeof rawEnd === 'string' && !isNaN(Number(rawEnd)) ? parseInt(rawEnd, 10) : 0;

        const sortDirection = req.query.order === 'asc' ? 1 : -1;

        const task = await Task.find({
            assignedTo: creatorId,
            ...(req.query.status && { status: req.query.status }),
            ...(req.query.projectId && { projectId: req.query.projectId }),
            ...(req.query.searchTerm && {
                $or: [
                    { taskName: { $regex: req.query.searchTerm, $options: 'i' } },
                    { taskDesc: { $regex: req.query.searchTerm, $options: 'i' } },
                ],
            }),
        }).sort({ updatedAt: sortDirection }).limit(endIndex).skip(startIndex).populate("assignedTo", "firstName lastName email").populate("projectId", "projectName");

        res.status(200).json({
            task
        })

    } catch (error) {
        next(error)
    }
}

export const getTheTask = async (req: Request, res: Response, next: NextFunction) => {
    const taskId = req.params.taskId;

    try {
        const task = await Task.findById(taskId).populate("assignedTo", "firstName lastName email image").populate("projectId", "projectName");
        if (!task) {
            return next(errorHandler(404, "task not found"));
        }
        res.status(200).json(task);
    } catch (error) {
        next(error)
    }
}

export const fetchTaskAssignedToProject = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        throw new Error('unauthorized to get all tasks');
    }
    const userId = req.user.id
    try {

        const projects = await Project.find({ members: userId })// get all projects where this user is member
        if (projects.length > 0) {
            const projectIds = projects.map(project => project._id) //projectIds is a array that will contain all _id of project

            const tasksAssigned = await Task.find({ projectId: { $in: projectIds } })//we will take all tasks that projectId is equal to projectIds

            const totalTasks = await Task.countDocuments({ projectId: { $in: projectIds } });
            const tasksByStatus = await Task.aggregate([
                { $match: { projectId: { $in: projectIds } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])

            const taskState: { total: number, toDo: number, inProgress: number, completed: number } = {
                total: totalTasks,
                toDo: 0,
                inProgress: 0,
                completed: 0
            }
            tasksByStatus.forEach(task => {
                if (task._id === 'To do') { taskState.toDo = task.count; }
                if (task._id === 'In progress') { taskState.inProgress = task.count; }
                if (task._id === 'Completed') { taskState.completed = task.count; }
            })

            //prendre les tâches dont l'échéance est dans les 7 jours
            const today = new Date(); const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
            const tasksInLimit = await Task.find({ projectId: { $in: projectIds }, deadLine: { $lte: nextWeek } }).sort({ deadLine: 1 })  //prendre les tâches dont le deadLine est <= 7 jours (qui arrivent bientôt à l'échéance ou en ratard)

            res.status(200).json({ tasksAssigned, taskState, tasksInLimit })
        }

        res.status(200).json([])
    } catch (error) {
        next(error);
    }
}

export const getTaskState = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
        throw new Error('unauthorized to get all tasks');
    }
    const userId = req.user.id;
    try {
        const projects = await Project.find({ members: userId }); //search all projects where this user is member
        if (!projects || projects.length === 0) {
            res.status(200).json({ totalTasks: 0, tasksByStatus: {}, tasksByMonth: [], completedTasksByProject: [] });
            return;
        }
        const projectIds = projects.map((project) => project._id); //l map all projects finded and put their _id in projectIds

        const tasksByStatus = await Task.aggregate([ //for counting the tasks by their status
            { $match: { projectId: { $in: projectIds } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        type TaskStatusType = "To do" | "In progress" | "Completed";
        //for the response format
        const taskStatusCount: Record<TaskStatusType, number> = {
            "To do": 0,
            "In progress": 0,
            "Completed": 0
        };
        tasksByStatus.forEach((task) => {
            taskStatusCount[task._id as TaskStatusType] = task.count;  //it's means that task._id will be "To do" , "In progress" or "Completed" and will contain the count
        })

        //for counting the tasks by their month
        const tasksByMonth = await Task.aggregate([
            { $match: { projectId: { $in: projectIds } } },
            { $group: { _id: { $month: "$createdAt" }, tasks: { $sum: 1 } } }
        ]);

        //counting the completed tasks by their project {_id , count}
        const completedTasksByProject = await Task.aggregate([
            { $match: { projectId: { $in: projectIds }, status: "Completed" } },
            { $group: { _id: "$projectId", count: { $sum: 1 } } }
        ]).exec();

        const projectIdName = await Project.find({ _id: { $in: completedTasksByProject.map((p) => p._id) } }).select("_id projectName"); //it will contain id et projectName
        const taskWithNames = completedTasksByProject.map(task => {
            const project = projectIdName.find(p => (p._id as Types.ObjectId).equals(task._id));
            return { projectName: project ? project.projectName : "unknown project", count: task.count } //and I return this
        });

        res.status(200).json({
            totalTasks: taskStatusCount["To do"] + taskStatusCount["In progress"] + taskStatusCount["Completed"] /*total tasks*/,
            tasksByStatus: taskStatusCount, //total tasks by their status
            tasksByMonth,
            completedTasksByProject: taskWithNames
        });

    } catch (error) {
        next(error)
    }
}