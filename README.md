# CareerConnect - Group A (Fall 2027)
### SOEN341: Software Process | Concordia University

![FastAPI](https://img.shields.io/badge/FastAPI-%23009688?logo=fastapi&logoColor=white)

## What is CareerConnect ?
CareerConnect is a web-based platform designed to help job seekers manage their job search activities. <br>
The system allows users to create profiles, upload and manage resumes, search for job opportunities,
track submitted applications, and follow the progress of their application process. <br>
The platform aims to centralize job-search activities and help users stay organized throughout their career development
journey

## Who are we ? (Team Members)
- Doryan Gonin - Scrum Master, Database
- Candys - Frontend skeleton, auth UI(sign up and login forms, validation, errors) - README

## Technologies
<!--- Once this is fully decided, @doryan-gonin will create custom badges to align with best practices -->

  Layer             Technology              Notes   
- Frontend -->	React + TypeScript       -	Component-based UI
- Backend  -->	Node.js + Express        -	REST API
- Database -->	PostgreSQL               -	Relational data (users, jobs, applications)
- Auth     -->	JWT + bcrypt -	Stateless sessions
AI Integration -->	External AI API (e.g., OpenAI)	--> Resume feedback / matching / cover letters
CI/CD	GitHub Actions	Lint, test, build on every PR
Testing	   --> Jest, React Testing Library -	Unit + component tests
Project Management -->	GitHub Issues + GitHub Projects (board) - Backlog, sprint tracking

## Problem Statement
Job seekers routinely apply to dozens of positions across multiple platforms and lose track of where each application stands. There is rarely a single place to store resumes, monitor application status (Applied, Interview, Offered, Rejected), or get reminded about upcoming deadlines. At the same time, recruiters lack a lightweight way to post openings and manage the flow of incoming candidates without enterprise-grade ATS software.

## Proposed solution
Career-Connect is a web-based platform that centralizes the job search process for two types of users, Job Seekers and Recruiters. Job seekers can build a profile, upload resumes, search and filter postings, apply, and track every application's status from one dashboard. Recruiters can post openings, review applicants, and update candidate status. The platform also integrates a Generative AI feature that gives job seekers automated resume feedback and job-matching suggestions.

## Setup instructions
## Running Instructions

## Core features
- User registration, authentication, and profile management
- Resume upload and management
- Job posting management for recruiters
- Job search and filtering
- Job application submission
- Application status tracking (Applied, Interview, Offered, Rejected)
- Application history dashboard
- Notifications and reminders for deadlines
- Saved jobs / favourites
- AI-assisted resume feedback and job-matching suggestions (Generative AI feature)
- AI-assisted cover letter generator (team-proposed original feature - see (link to docs/user-stories.md)
## Proposed features
