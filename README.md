# Martendal Weekend 2026

Landing page and lead tracking application built for **Pecuária Martendal** to support the Martendal Weekend 2026 campaign in Vilhena, Rondônia, Brazil.

The application was designed as a conversion-focused entry point for paid traffic, directing visitors to WhatsApp while preserving campaign attribution and tracking key user interactions.

## Live Application

https://pecuariamartendal.kauadev.net.br

## Overview

The project was developed for the **Martendal Weekend 2026** auction campaign, held from September 11–13, 2026.

The public interface follows a minimal, single-purpose approach:

- Event identification
- Date and location
- Direct reservation CTA
- WhatsApp integration
- Campaign attribution
- Conversion tracking

The application also includes a restricted internal area for lead monitoring.

## Features

- Responsive landing page
- Mobile-first interface
- Single-screen conversion flow
- WhatsApp reservation CTA
- Pre-filled WhatsApp message
- UTM parameter persistence
- Meta Pixel integration
- Custom conversion events
- Lead tracking
- Restricted administrative dashboard
- Google authentication for internal access
- Custom domain deployment

## Tracking

The application tracks the main stages of the conversion journey.

Implemented events:

```text
PageView
ViewContent
Contact
WhatsAppReservationClick

Campaign attribution parameters are preserved when available:

utm_source
utm_medium
utm_campaign
utm_content
utm_term

This makes it possible to identify which campaigns, audiences and creatives generated traffic and reservation intent.

Routes
Public
/leilao-martendal-weekend-2026

Main campaign landing page.

Internal
/leads-panel

Restricted dashboard used for lead monitoring and campaign operations.

Authentication rules and authorized accounts are intentionally not documented in this repository.

Tech Stack
React
TypeScript
Vite
Tailwind CSS
Google Authentication
Meta Pixel
WhatsApp API links
Custom analytics events
Getting Started

Clone the repository:

git clone <repository-url>
cd <project-directory>

Install dependencies:

npm install

Start the development server:

npm run dev

Create a production build:

npm run build

Preview the production build locally:

npm run preview
Environment Variables

Environment-specific credentials and configuration must not be committed to the repository.

Create a local environment file when required:

.env

Example:

VITE_APP_URL=
VITE_META_PIXEL_ID=
VITE_GOOGLE_CLIENT_ID=

Additional variables may be required depending on the deployment environment.

Project Goals

The main technical goals of the project were:

Reduce friction between ad click and reservation.
Provide a fast experience on mobile devices.
Preserve paid media attribution.
Track meaningful conversion actions.
Connect the public campaign experience with an internal lead monitoring workflow.
Security

Sensitive information such as:

authentication credentials;
authorized Google accounts;
internal access rules;
tokens;
API keys;

must be stored as environment variables or configured directly in the deployment environment.

They must never be committed to the repository.

Deployment

Production:

https://pecuariamartendal.kauadev.net.br

The application uses a custom subdomain under kauadev.net.br.

Author

Kauã Fernandes

Software Development · Systems · Integrations · Automation

Website: https://kauadev.net.br
Email: contato@kauadev.net.br
