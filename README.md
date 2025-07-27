# 📲 Raseed: Your AI-Powered Receipt Companion  
*Smartly Ingest Receipts. Analyze Spending. Stay Financially and Health Conscious — All Powered by Google AI.*

Raseed is an AI-powered assistant built around the Google ecosystem that digitizes receipts and transforms them into actionable insights. Whether it’s financial health or real-world health, Raseed bridges both worlds through intelligent automation using cutting-edge GenAI tools and Google Cloud services.

---

## 📚 Table of Contents

- [Overview](#overview)
- [Key Features](#-key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage & Demo](#usage--demo)
- [Future Work](#-future-work)
- [License](#-license)

---

## 🧠 Overview

Raseed leverages the *essence of Generative AI* to create a lightweight, fast, and contextual financial-health companion. By digitizing receipts from images or screenshots, it helps users extract structured data, generate rebuy passes, and provide contextual insights using LLMs. All of this is orchestrated through a streamlined pipeline deeply integrated with Google services.

---

### 🔑 Key Features

- ✨ *Minimalist UI* with blazing-fast interaction
- 🧾 *Seamless Receipt Ingestion* from images or URLs
- 🧠 *LLM-Powered Financial Insights* from transactions
- 🔁 *Rebuy Pass Generation* for recurring items
- 🌐 *Health + Finance Ecosystem* powered by Google Cloud, Vertex AI, and Firebase

---

## 🛠 Tech Stack

| Category | Tools Used |
|----------|------------|
| *AI & LLM Orchestration* | Genkit + ADK (Agent Development Kit) |
| *Frontend* | React, TailwindCSS, shadcn/ui |
| *Backend* | Firebase Functions, Firestore |
| *OCR & Vision* | Google Cloud Vision API |
| *LLM APIs* | Gemini 1.5 Pro |
| *Cloud Platform* | Google Cloud Platform (GCP) |

---

## Usage / Screens 

## 🚀 Getting Started

To run the project locally:

bash
git clone https://github.com/yesh-045/raseed-wallet


To start The Frontend

bash
cd client
npm install
npm run dev


To start The backend

1. Move to The backend Folder
bash
cd server

2. Create a Virtual Envirnoment
- For Windows 
bash
    python -m venv venv
    ./venv/Scripts/activate

- For Mac \ Linux
bash
    python -m venv venv
    ./venv/bin/activate


## 🚀 Future Work

We're actively evolving *Raseed* into a fully-fledged *Google-integrated experience*:

- 🌐 *Multilingual Support*  
  For wider reach and inclusivity across diverse user bases.

- 🗓 *Google Calendar Integration (MCP)*  
  Automatically store rebuy passes as smart, scheduled reminders directly in the user's Google Calendar.

- ⌚ *Fitbit Ecosystem Support*  
  Correlate spending patterns with user health data using Fitbit APIs to provide holistic insights.

- 📲 *Smart Alerts*  
  Deliver context-aware notifications that blend financial trends with personalized health guidance.

> These features aim to transform Raseed into a complete *lifestyle assistant* that bridges *personal finance* and *well-being* through seamless integration with the *Google ecosystem*.


## 📝 License

This project is licensed under the *MIT License* – see the [LICENSE](./LICENSE) file for details.

MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell      
copies of the Software, and to permit persons to whom the Software is          
furnished to do so, subject to the following conditions:                       

The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.                                

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR    
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,      
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE    
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER        
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
SOFTWARE.