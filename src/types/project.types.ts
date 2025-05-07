import { Document, Types } from "mongoose";

export interface IProject {
    projectName: string,
    projectDesc: string,
    creator: Types.ObjectId,
    members: Types.ObjectId[]
}

export type ProjectDocument = IProject & Document