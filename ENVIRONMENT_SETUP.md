# MongoDB Environment Variables Setup

## Add these variables to your .env.local file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# For Production (use HTTPS):
# NEXTAUTH_URL=https://yourdomain.com

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# MongoDB Configuration - Updated to use separate database name
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=scorekeeper
```

## For MongoDB Atlas (Cloud):

```env
# MongoDB Atlas connection (without database name in URI)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_NAME=scorekeeper
```

## For Local MongoDB:

```env
# Local MongoDB connection
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=scorekeeper
```

## Benefits of Separate Database Name:

- **Environment-specific databases**: Use different database names for dev/staging/production
- **Easier testing**: Switch to test databases without changing connection strings
- **Better organization**: Keep database configuration separate from connection details
- **Deployment flexibility**: Change database names per environment

## Example Environment Configurations:

### Development (.env.local):

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=scorekeeper_dev
```

### Production (.env.production):

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
MONGODB_NAME=scorekeeper_prod
```

### Testing (.env.test):

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_NAME=scorekeeper_test
```

Delete this file after setting up your environment variables.
