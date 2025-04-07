# Adding a New Application to the Window System

Follow these steps to integrate a new Vue component as a windowed application:

1.  **Create Your Application Component:**

    - Develop your application logic and UI within a standard Vue component (`.vue` file).
    - Place this component file anywhere appropriate within your project structure (e.g., `src/components/apps/YourNewApp.vue`).

2.  **Import the Component in `apps.ts`:**

    - Open `frontend/src/components/WindowSystem/apps.ts`.
    - Add an import statement at the top to bring in your component:
      ```typescript
      import YourNewAppComponent from "@/path/to/YourNewAppComponent.vue";
      ```
    - Replace `@/path/to/YourNewAppComponent.vue` with the actual path to your component file.

3.  **Define the App Configuration:**

    - Still in `apps.ts`, locate the `App` interface definition to understand all available configuration options.
    - Create a new object conforming to this interface. You **must** provide:
      - `id`: A unique string identifier for the app (e.g., `'my-cool-app'`).
      - `title`: The text that will appear in the window's title bar (e.g., `'My Cool App'`).
      - `iconId`: The ID used to look up the app's icon. Ensure this icon ID corresponds to an actual icon defined in your icon system (e.g., `svgIconsMap`).
      - `appComponent`: The variable name you used when importing your component (e.g., `YourNewAppComponent`).
    - You can also add optional properties like `initialWidth`, `initialHeight`, `iconColor`, `titleBarColor`, etc., as defined in the `App` interface.

4.  **Register the App:**

    - Find the `apps` array which is exported from `apps.ts`.
    - Add the configuration object you created in the previous step to this array:

      ```typescript
      export const apps: App[] = [
        // ... other existing app definitions ...
        {
          id: "my-cool-app",
          title: "My Cool App",
          iconId: "coolAppIcon", // Make sure this icon exists!
          appComponent: YourNewAppComponent,
          // --- Optional Properties ---
          initialWidth: 600,
          initialHeight: 400,
          iconColor: "text-green-500",
          // ... any other options ...
        },
      ];
      ```

Once these steps are completed, your new application should be available within the window management system.
