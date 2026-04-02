export class PlannerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerValidationError";
  }
}

export class PlannerProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerProviderError";
  }
}
