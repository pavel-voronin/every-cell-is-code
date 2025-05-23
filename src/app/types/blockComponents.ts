export interface BlockComponent {
  unload(): void;
}

export interface FrontendComponent extends BlockComponent {
  element: HTMLElement;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BackendComponent extends BlockComponent {}

export interface EventsInputComponent extends BlockComponent {
  reEmitEvent(eventId: number): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MessagesInputComponent extends BlockComponent {}

export interface ContainerComponent extends BlockComponent {
  container: HTMLDivElement;
  scale: number;
  appendFrontend(frontend: FrontendComponent): void;
  get w(): number;
  get h(): number;
}
