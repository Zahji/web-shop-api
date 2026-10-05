export enum CategoryStatus {
  Available = "AVAILABLE",
  Unavailable = "UNAVAILABLE",
}

export interface NewCategory {
  name: string;
  description: string;
}

export interface Category extends NewCategory {
  categoryId: number;
  status: CategoryStatus;
}
