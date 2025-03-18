import { getNameWithPrefix } from "./config";

/**
 * Base interface for all MCP component definitions
 */
export interface BaseDefinition {
  name: string;
  description: string;
}

/**
 * Error types for component operations
 */
export enum ComponentErrorType {
  NOT_FOUND = "NOT_FOUND",
  INVALID_ARGS = "INVALID_ARGS",
  EXECUTION_ERROR = "EXECUTION_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
}

/**
 * Custom error class for component operations
 */
export class ComponentError extends Error {
  constructor(
    public readonly type: ComponentErrorType,
    message: string,
    public readonly componentName: string
  ) {
    super(`${type}: ${message}`);
    this.name = "ComponentError";
  }
}

/**
 * Base class for all MCP components
 */
export abstract class BaseComponent<TDefinition extends BaseDefinition> {
  private readonly prefixedName: string;

  constructor(private readonly definition: TDefinition) {
    this.prefixedName = getNameWithPrefix(definition.name);
  }

  /**
   * Get the component name
   */
  public getName(): string {
    return this.prefixedName;
  }

  public getDescription(): string {
    return this.definition.description;
  }

  /**
   * Get the component definition
   */
  public getDefinition(): TDefinition {
    return {
      ...this.definition,
      name: this.prefixedName,
    };
  }

  /**
   * Get the component definition for internal use
   */
  protected getInternalDefinition(): TDefinition {
    return this.definition;
  }
}

/**
 * Base repository for managing collections of MCP components
 */
export abstract class BaseRepository<
  TComponent extends BaseComponent<TDefinition>,
  TDefinition extends BaseDefinition,
> {
  private readonly components = new Map<string, TComponent>();

  /**
   * Register a component with the repository
   * @throws {ComponentError} If component with same name already exists
   */
  public register(component: TComponent): void {
    const name = component.getName();
    if (this.components.has(name)) {
      throw new ComponentError(
        ComponentErrorType.ALREADY_EXISTS,
        `Component ${name} already registered`,
        name
      );
    }
    this.components.set(name, component);
  }

  /**
   * Protected method to remove a component from the repository
   */
  protected removeComponent(name: string): void {
    this.components.delete(name);
  }

  /**
   * Get a component by name
   * @returns The component or undefined if not found
   */
  public get(name: string): TComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Get all registered components
   */
  public getAll(): TComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Get all component definitions
   */
  public getAllDefinitions(): TDefinition[] {
    return this.getAll().map(
      (component) => component.getDefinition() as TDefinition
    );
  }
}
