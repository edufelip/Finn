# Deployment & Infrastructure Specification

## Purpose
Defines the strategies for building, deploying, and maintaining the application infrastructure.

## Functional Requirements
- **FR-DEPL-01**: The system shall support manual native builds for iOS and Android.
- **FR-DEPL-02**: The system shall manage database migrations for development and production environments.
- **FR-DEPL-03**: The system shall provide a mechanism for seed data.

## Infrastructure Strategy

### 1. Environments
- **Development**: Local development using Expo CLI and Supabase Local/Dev.
- **Production**: Manual builds connecting to the Production Supabase instance.

### 2. Configuration Management (`app.config.ts`)
The application configuration is dynamic based on the `APP_ENV` environment variable:
- **Production (`prod`)**:
    - App Name: "Finn"
    - Slug: "finn"
    - Bundle ID: `com.edufelip.finn`
    - Scheme: `finn`
- **Development (`dev`)**:
    - App Name: "Finn Dev"
    - Slug: "finn-dev"
    - Bundle ID: `com.edufelip.finn.dev`
    - Scheme: `finn-dev`

### 3. Database Migrations & Seeding
- **Workflow**: Create migration → Link (`db:link`) → Push (`db:push`).
- **Initialization**: `supabase-remote-init.sh` script automates setup.
- **Seeding**: `seed-remote.js` populates the database using the Service Role key.

### 4. CI/CD (GitHub Actions)
- **Workflows**: `ios-release.yml`, `android-release.yml`, `maestro-e2e.yml`.

## Terminology
- **Prebuild**: Generating native `ios` and `android` projects from configuration.
- **Migration**: Versioned SQL script for schema evolution.
