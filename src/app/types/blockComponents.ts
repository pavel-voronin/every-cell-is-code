export interface BlockComponent {
  unload(): void;
}

export interface FrontendComponent extends BlockComponent {
  element: HTMLElement;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BackendComponent extends BlockComponent {}

export interface InputComponent extends BlockComponent {
  reEmitEvent(eventId: number): void;
}

export interface ContainerComponent extends BlockComponent {
  container: HTMLDivElement;
  scale: number;
  appendFrontend(frontend: FrontendComponent): void;
  get w(): number;
  get h(): number;
}
