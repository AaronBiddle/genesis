# Logging Control Panel

A flexible, configurable logging system that supports both hierarchical log levels and functional domains.

## Features

- **Hierarchical logging levels**: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- **Domain-based filtering**: Network, UI, Data Layer, Authentication, Performance
- **Namespace filtering**: Filter logs by specific modules or components
- **Persistent settings**: Settings are saved to localStorage and survive page reloads
- **Configurable**: All logging parameters are defined in a central configuration file

## Usage

### Basic Usage

```typescript
import { getLogger } from '$lib/components/LogControlPanel/logger';

// Create a logger for a component (UI domain)
const logger = getLogger('frontend.components.MyComponent', 'ui');

// Log messages at different levels
logger.debug('Component initialized');
logger.info('User action triggered', { actionType: 'click', elementId: 'submit-btn' });
logger.warn('Operation taking longer than expected');
logger.error('Failed to load data', error);
```

### Domains

Domains represent functional areas of your application. Use them to group related logging:

- `network`: API calls, fetch operations, WebSocket communication
- `ui`: Component rendering, user interactions
- `data`: State management, data transformations
- `auth`: Authentication, authorization, sessions
- `perf`: Performance measurements, optimizations

### Namespaces

Namespaces typically represent specific modules or components in your application. Use dot notation
for hierarchical organization:

```
frontend.components.MultiViewPanel
frontend.services.ApiService
backend.db.QueryService
shared.utils.DateFormatter
```

## Configuration

All logging configuration is centralized in `logConfig.ts`:

- Define new domains by adding to `LOG_DOMAINS` array
- Add relevant namespaces to the `NAMESPACES` array
- Adjust default log level in `DEFAULT_LOG_CONFIG`

## Using the Control Panel

The Log Control Panel app allows users to:

1. **Adjust log levels** globally or per domain
2. **Enable/disable domains** to focus on specific functional areas
3. **Filter namespaces** to include or exclude specific modules

## Technical Details

### Local Storage Persistence

Log settings are automatically saved to `localStorage` under the key `logConfig` and restored when the application loads.

### Extending the System

To add new domains or logging capabilities:

1. Update the `LOG_DOMAINS` array in `logConfig.ts`
2. Add new namespaces to the `NAMESPACES` array
3. Use the logger in your components

## Example

```typescript
import { getLogger } from '$lib/components/LogControlPanel/logger';

// Component setup
const logger = getLogger('frontend.components.UserProfile', 'ui');
logger.debug('Component initialized');

// API call with network domain
const apiLogger = getLogger('frontend.services.UserService', 'network');
apiLogger.info('Fetching user data', { userId });

try {
  // Make API call
  apiLogger.debug('Request details', { url, method, headers });
  
  // Process data with data domain
  const dataLogger = getLogger('frontend.services.DataTransform', 'data');
  dataLogger.trace('Raw response', response);
  dataLogger.debug('Transformed data', transformedData);
  
  // Back to UI domain
  logger.info('User data loaded');
} catch (error) {
  apiLogger.error('API call failed', error);
  logger.warn('Failed to load user data, showing fallback UI');
}
``` 