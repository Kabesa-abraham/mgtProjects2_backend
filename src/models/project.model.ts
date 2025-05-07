import { Model, model, Schema } from 'mongoose';
import { IProject, ProjectDocument } from '../types/project.types.js'

const ProjectSchema = new Schema<IProject, Model<ProjectDocument>>({
    projectName: {
        type: String,
        required: true,
        trim: true
    },
    projectDesc: {
        type: String,
        trim: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    }
}, { timestamps: true }
);

const Project = model<IProject, Model<ProjectDocument>>("Project", ProjectSchema);

export default Project;