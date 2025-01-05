# Garuda ![(LOGO)](IMAGES/image.png)

Garuda is an integrated emergency response system designed to provide efficient and streamlined disaster management through a connected web platform. The system comprises four interconnected sections, each working together to ensure real-time monitoring, mapping, drone deployment, and AI-driven injury detection.  

---------

![GCS](IMAGES/image-1.png)

---------

## 1. Event Detection App  

The **Event Detection App** is the initial step in Garuda’s emergency response workflow. It provides rapid detection and alert mechanisms.  
![alt text](IMAGES/image-2.png) ![alt text](IMAGES/image-3.png)

### Features:  
- **Fall Detection**:  
  - If a device detects a fall, it starts **beeping for 7 seconds**.  
  - If the user **responds** within 7 seconds, the alert is **neglected**.  
  - If the user **does not respond**, the app:  
    - Automatically sends the **current location** to the website.  
    - **Calls and messages** the user’s pre-configured speed dial emergency number.  

- **Manual Help Request**:  
  - Users can manually send a help request via the app directly to the website.  

---



## 2. Mapping  

Once a request is received, the **Mapping Section** is activated for a comprehensive disaster overview.  

### Features:  
1. **GPS Plotting**:  
   - Plots the exact location of disasters or injured human on a map.  
2. **Threshold Calculation**:  
   - Compares population density against thresholds:  
     - **Below Threshold**: Sends automated calls and messages to speed dial.  
     - **Above Threshold**: Activates the Drone Section.  

---

## 3. Drone Section  

The Drone Section is activated when thresholds are exceeded, ensuring advanced disaster management.  

### Functions:  
1. **Automatic Deployment**: Drones reach disaster locations autonomously.  
2. **Payload Delivery**: Delivers essential supplies such as medicine and bandages.  
3. **Aerial Imaging**: Captures detailed disaster site imagery for mapping and analysis.  
4. **Inspection**: Conducts individual and aerial assessments to gather information.

---

## 4. AI and Injury Detection  

The **AI Section** processes data from drones and mapping to classify and prioritize injuries.  

### Features:  
- **Human Count**: Estimates the number of individuals affected.  
- **Injury Detection**: Classifies injuries into three priority levels:  
  - **a. Normal**  
  - **b. Intermediate**  
  - **c. Severe**  
- **Priority Mapping**: Marks priorities and sends this information to the website.  
- **Shortest Path Calculation**: Website determines the shortest path for ambulances to reach injured individuals.  
- **Government Notifications**: Sends alerts and updates to government agencies for resource deployment.  

---

## 5. Website Integration  

The **Website** serves as the central hub for managing all data and response workflows.  

### Functions:  
- Real-time monitoring of events and statuses.  
- Provides a visual interface for mapping, drone deployment, and AI-driven injury classification.  
- Sends updates and alerts to responders, government officials, and emergency services.  
- Manages resource allocation and prioritizes actions based on AI insights and mapping data.  

---


*Garuda: Revolutionizing emergency response through innovation and integration.*  
