# Alibaba Cloud Deployment Guide

This guide covers deploying Job Trainer to Alibaba Cloud using ECS instances with managed services.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Alibaba Cloud                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  ECS (App)  │───▶│  RDS (PG)   │    │   OSS       │              │
│  │  Port 3000  │    │  Port 5432  │    │  (Storage)  │              │
│  └──────┬──────┘    └─────────────┘    └─────────────┘              │
│         │                                                            │
│         │    ┌─────────────┐                                        │
│         └───▶│   Redis     │                                        │
│              │  Port 6379  │                                        │
│              └─────────────┘                                        │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    VPC (172.16.0.0/12)                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │  Public Sub │  │ Private Sub │  │ Private Sub │          │    │
│  │  │  (ECS, NAT) │  │ (RDS,Redis) │  │   (OSS)     │          │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Alibaba Cloud Account** with billing enabled
2. **Terraform** >= 1.5.0 installed locally
3. **Docker** installed for building images
4. **Alibaba Cloud CLI** (optional, for manual operations)

## Quick Start

### 1. Configure Credentials

Set Alibaba Cloud credentials as environment variables:

```bash
export ALICLOUD_ACCESS_KEY="your-access-key-id"
export ALICLOUD_SECRET_KEY="your-secret-access-key"
```

Or use Alibaba Cloud CLI:

```bash
aliyun configure
```

Get credentials from: [RAM Console](https://ram.console.aliyun.com/) > Users > Create User > AccessKey Management

Then configure the deployment variables:

```bash
cd deploy/alibaba/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your deployment settings (no credentials needed)
```

### 2. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

This creates:
- VPC with public/private subnets
- ECS instance (2 vCPU, 4GB RAM)
- RDS PostgreSQL instance
- Redis instance
- OSS bucket for storage
- Security groups

### 3. Build and Push Docker Image

```bash
# Login to ACR
docker login --username=<your-username> registry.ap-southeast-1.cr.aliyuncs.com

# Build and push
./scripts/build-and-push.sh
```

### 4. Deploy Application

```bash
./scripts/deploy.sh --host <ECS_PUBLIC_IP> --tag latest
```

## Manual Deployment Steps

If you prefer step-by-step deployment:

### Step 1: SSH into ECS

```bash
ssh -i ~/.ssh/job-trainer root@<ECS_PUBLIC_IP>
```

### Step 2: Setup Application Directory

```bash
mkdir -p /opt/job-trainer
cd /opt/job-trainer

# Copy docker-compose.prod.yml and .env
# (do this from your local machine)
```

### Step 3: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://jobtrainer:YOUR_PASSWORD@<RDS_ENDPOINT>:5432/jobtrainer
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@<REDIS_ENDPOINT>:6379
S3_ENDPOINT=https://oss-ap-southeast-1.aliyuncs.com
S3_REGION=ap-southeast-1
S3_BUCKET=jobtrainer-production-storage
S3_ACCESS_KEY=YOUR_OSS_ACCESS_KEY
S3_SECRET_KEY=YOUR_OSS_SECRET_KEY
NEXTAUTH_URL=http://<ECS_PUBLIC_IP>:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
AI_PROVIDER=openai
AI_API_KEY=YOUR_OPENAI_API_KEY
AI_MODEL=gpt-4
IMAGE_TAG=latest
EOF
```

### Step 4: Pull and Start

```bash
docker-compose pull
docker-compose up -d
```

## CI/CD Pipeline

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automates:

1. Building Docker image on push to `main`
2. Pushing to Alibaba Cloud ACR
3. Deploying to ECS via SSH

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `ACR_USERNAME` | Alibaba Cloud ACR username |
| `ACR_PASSWORD` | Alibaba Cloud ACR password |
| `ECS_HOST` | ECS instance public IP |
| `ECS_USER` | SSH user (default: root) |
| `ECS_SSH_KEY` | SSH private key content |

## Infrastructure Details

### ECS Instance
- **Type**: ecs.c6.large (2 vCPU, 4GB RAM)
- **OS**: Alibaba Cloud Linux 3
- **Storage**: 40GB ESSD
- **Ports**: 22 (SSH), 3000 (App)

### RDS PostgreSQL
- **Engine**: PostgreSQL 16 with pgvector
- **Type**: rds.pg.s2.large (2 vCPU, 4GB RAM)
- **Storage**: 50GB ESSD
- **Backup**: 7 days retention

### Redis
- **Engine**: Redis 7.0
- **Type**: redis.master.small.default (1GB)
- **Architecture**: Master-replica

### OSS Bucket
- **Name**: jobtrainer-production-storage
- **Region**: ap-southeast-1
- **ACL**: Private

## Security Configuration

### Security Groups

| Group | Inbound Rules |
|-------|---------------|
| ECS SG | 22 (SSH from your IP), 3000 (HTTP from ALB) |
| RDS SG | 5432 (from ECS SG only) |
| Redis SG | 6379 (from ECS SG only) |

### Best Practices

1. **Never expose RDS/Redis to public internet**
2. **Use RAM roles instead of access keys when possible**
3. **Enable MFA for root account**
4. **Rotate access keys regularly**
5. **Use KMS for sensitive secrets**

## Monitoring

### CloudMonitor

Alibaba Cloud CloudMonitor provides:
- CPU/Memory/Disk metrics
- Network traffic monitoring
- Custom alarms

### Application Logs

```bash
# View logs on ECS
ssh -i ~/.ssh/job-trainer root@<ECS_IP>
cd /opt/job-trainer
docker-compose logs -f
```

### Health Check

```bash
curl http://<ECS_IP>:3000/api/health
```

## Cost Estimation

| Resource | Spec | Monthly Cost (USD) |
|----------|------|-------------------|
| ECS | 2 vCPU, 4GB | ~$40 |
| RDS | 2 vCPU, 4GB, 50GB | ~$60 |
| Redis | 1GB | ~$20 |
| OSS | 50GB + traffic | ~$5 |
| NAT Gateway | Small | ~$30 |
| **Total** | | **~$155/month** |

*Costs vary by region. Check [Alibaba Cloud Pricing](https://www.alibabacloud.com/pricing) for current rates.*

## Troubleshooting

### Cannot connect to ECS

```bash
# Check security group allows SSH from your IP
# Verify SSH key permissions
chmod 600 ~/.ssh/job-trainer

# Test connection
ssh -v -i ~/.ssh/job-trainer root@<ECS_IP>
```

### Application not starting

```bash
# Check container logs
docker-compose logs app

# Verify environment variables
docker-compose config

# Check database connectivity
docker-compose exec app nc -zv <RDS_ENDPOINT> 5432
```

### Database connection issues

```bash
# Check RDS security group allows ECS
# Verify whitelist in RDS console
# Test from ECS
psql "postgresql://jobtrainer:PASSWORD@<RDS_ENDPOINT>:5432/jobtrainer"
```

## Maintenance

### Updating Application

```bash
# Build new image
./scripts/build-and-push.sh

# Deploy with new tag
./scripts/deploy.sh --host <ECS_IP> --tag <NEW_TAG>
```

### Database Backup

RDS automatically backs up. Manual backup:

```bash
# From ECS
pg_dump -h <RDS_ENDPOINT> -U jobtrainer jobtrainer > backup_$(date +%Y%m%d).sql
```

### Scaling

To scale the application:

1. **Vertical**: Change ECS instance type in Terraform
2. **Horizontal**: Add more ECS instances behind SLB (load balancer)

## Cleanup

To destroy all resources:

```bash
cd deploy/alibaba/terraform
terraform destroy
```

⚠️ **Warning**: This will delete all data. Make sure to backup first!

## Additional Resources

- [Alibaba Cloud Documentation](https://www.alibabacloud.com/help/en/)
- [ECS User Guide](https://www.alibabacloud.com/help/en/ecs/)
- [RDS PostgreSQL](https://www.alibabacloud.com/help/en/rds/apsaradb-rds-for-postgresql/)
- [OSS Documentation](https://www.alibabacloud.com/help/en/oss/)