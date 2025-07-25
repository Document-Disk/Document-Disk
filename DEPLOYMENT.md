# Deployment Guide for Document Disk

This guide explains how to deploy the Document Disk application to Render.com with MongoDB Atlas.

## Prerequisites

1. A [Render.com](https://render.com) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account

## Setting up MongoDB Atlas

1. **Create a MongoDB Atlas Cluster**:
   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new project (if needed)
   - Build a new cluster (the free tier is sufficient for starting)
   - Choose your preferred cloud provider and region

2. **Configure Database Access**:
   - Go to the "Database Access" section
   - Add a new database user with a secure password
   - Give this user read and write permissions

3. **Configure Network Access**:
   - Go to the "Network Access" section
   - Add a new IP address entry
   - For development, you can use `0.0.0.0/0` to allow access from anywhere (not recommended for production)
   - For production, add Render.com's IP addresses

4. **Get Your Connection String**:
   - Go to your cluster and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - This will be your `MONGO_URL` environment variable

## Deploying to Render.com

### Using the Render Dashboard

1. **Log in to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and sign in

2. **Create a New Blueprint**:
   - Click "New" and select "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing this project

3. **Configure Environment Variables**:
   - In the Render dashboard, navigate to your service
   - Go to the "Environment" tab
   - Add the following environment variables:
     - `MONGO_URL`: Your MongoDB Atlas connection string
     - `DB_NAME`: `document_disk_production` (or your preferred database name)
     - `SECRET_KEY`: A secure random string for JWT encryption

4. **Deploy**:
   - Render will automatically deploy your application based on the `render.yaml` configuration
   - The deployment process will create both the backend and frontend services

### Using the CLI

Alternatively, you can use the Render CLI:

```bash
render blueprint up
```

## Verifying Deployment

1. Once deployed, you can access your application at:
   - Frontend: `https://document-disk-frontend.onrender.com`
   - Backend API: `https://document-disk-backend.onrender.com/api`

2. Test the API health check endpoint:
   - Visit `https://document-disk-backend.onrender.com/api/`
   - You should see a JSON response: `{"message":"Document Disk API is running"}`

## Troubleshooting

- **Connection Issues**: Ensure your MongoDB Atlas IP whitelist includes Render's IPs
- **Build Failures**: Check the build logs in the Render dashboard
- **Runtime Errors**: Check the logs in the Render dashboard for each service

## Maintenance

- **Scaling**: You can adjust the service plan in the Render dashboard
- **Monitoring**: Use the Render dashboard to monitor your application's performance
- **Updates**: Push changes to your repository, and Render will automatically redeploy