export interface IBlockComponent {
  unload(): void;
}

export interface IFrontendComponent extends IBlockComponent {
  element: HTMLElement;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBackendComponent extends IBlockComponent {}

export interface IEventsInputComponent extends IBlockComponent {
  reEmitEvent(eventId: number): void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ISignalsInputComponent extends IBlockComponent {}

export interface IContainerComponent extends IBlockComponent {
  container: HTMLDivElement;
  scale: number;
  appendFrontend(frontend: IFrontendComponent): void;
  get w(): number;
  get h(): number;
}
