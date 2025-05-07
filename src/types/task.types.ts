import { Document, Types } from "mongoose";

export interface ITask {
    taskName: string,
    taskDesc: string,
    status: string,
    assignedTo: Types.ObjectId,
    projectId: Types.ObjectId,
    deadline: Date
}

export type TaskDocument = ITask & Document;