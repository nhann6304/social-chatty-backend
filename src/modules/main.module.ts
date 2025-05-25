import { CommonEntities } from "./common/common.module";
import { ModulesEntities } from "./models/models.module";

export const MainModule = [...ModulesEntities, ...CommonEntities];
