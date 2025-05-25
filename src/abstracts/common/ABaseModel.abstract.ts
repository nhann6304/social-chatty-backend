import { IBaseModel } from 'src/interfaces/common/IBaseMode.interface';
import { IUser } from 'src/interfaces/models/IUser.interface';
import {
    Column,
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';

export abstract class ABaseModel implements IBaseModel<IUser> {
    @Column('uuid')
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @VersionColumn({ default: 1 })
    version: number;

    @CreateDateColumn({
        type: 'datetime',
        precision: 3,
        name: 'created_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'datetime',
        precision: 3,
        name: 'updated_at',
        default: () => 'CURRENT_TIMESTAMP(3)',
        onUpdate: 'CURRENT_TIMESTAMP(3)',
    })
    updatedAt: Date;

    @Column('varchar', { name: 'created_by', length: 255, nullable: true })
    createdBy: IUser | string;

    @Column('varchar', { name: 'updated_by', length: 255, nullable: true })
    updatedBy: IUser | string;
}
