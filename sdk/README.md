# Sparkaph SDK

Official JavaScript SDK for building Sparkaph Mini Apps.

## Installation

### CDN (Browser)
```html
<script src="https://sparkaph.com/sdk/sparkaph-sdk.js"></script>
```

### NPM (Coming Soon)
```bash
npm install sparkaph-sdk
```

## Quick Start

```javascript
// Initialize SDK with your API token
const sparkaph = new SparkaphSDK('YOUR_API_TOKEN');

// Initialize with user token (passed from Sparkaph app)
await sparkaph.init(userToken);

// Get current user
const user = await sparkaph.getCurrentUser();
console.log('Hello,', user.username);
```

## API Reference

### Authentication

#### `init(userToken)`
Initialize SDK with user token from Sparkaph app.

```javascript
await sparkaph.init(userToken);
```

### Users

#### `getCurrentUser()`
Get current authenticated user.

```javascript
const user = await sparkaph.getCurrentUser();
```

#### `getUser(userId)`
Get user by ID.

```javascript
const user = await sparkaph.getUser('user-id');
```

### Messaging

#### `sendMessage(recipientId, content)`
Send message to a user.

```javascript
await sparkaph.sendMessage('user-id', 'Hello!');
```

### Storage

#### `saveData(key, value)`
Save data to app storage.

```javascript
await sparkaph.saveData('score', 100);
```

#### `getData(key)`
Get data from app storage.

```javascript
const score = await sparkaph.getData('score');
```

#### `deleteData(key)`
Delete data from app storage.

```javascript
await sparkaph.deleteData('score');
```

### Payments

#### `requestPayment(amount, description)`
Request payment from user.

```javascript
await sparkaph.requestPayment(10, 'Premium features');
```

### Notifications

#### `showNotification(title, message)`
Show notification to user.

```javascript
await sparkaph.showNotification('Achievement!', 'You unlocked a badge');
```

## Example App

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Sparkaph App</title>
  <script src="https://sparkaph.com/sdk/sparkaph-sdk.js"></script>
</head>
<body>
  <h1>Welcome to My App</h1>
  <div id="user-info"></div>
  
  <script>
    // Get user token from URL (passed by Sparkaph)
    const urlParams = new URLSearchParams(window.location.search);
    const userToken = urlParams.get('token');
    
    // Initialize SDK
    const sparkaph = new SparkaphSDK('YOUR_API_TOKEN');
    
    async function loadApp() {
      try {
        // Init with user token
        await sparkaph.init(userToken);
        
        // Get user info
        const user = await sparkaph.getCurrentUser();
        document.getElementById('user-info').innerHTML = 
          `Hello, ${user.username}!`;
          
        // Load user's saved data
        const score = await sparkaph.getData('score') || 0;
        console.log('Your score:', score);
        
      } catch (error) {
        console.error('Error loading app:', error);
      }
    }
    
    loadApp();
  </script>
</body>
</html>
```

## License

MIT
