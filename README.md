# ग्रामसंदेश

**गाववार्ता, महत्त्वाच्या सूचना आणि कार्यक्रम — आपल्या गावासाठी एकच फलक.**

`ग्रामसंदेश` is a Marathi-first village bulletin app with a React frontend and a Java Spring Boot API. Announcements are stored in an H2 database on the server, so everyone using the same running app sees the same updates.

## Run locally

Requirements: Java 17+, Maven, Node.js 20.19+.

1. Start the Java API in one terminal:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

2. Start React in another terminal:

   ```powershell
   cd frontend
   npm.cmd install
   npm.cmd run dev
   ```

3. Open the local URL printed by Vite (usually `http://localhost:5173`).

The database is saved under `backend/data/`. The frontend proxies `/api` requests to the Java API on port 8081.

## Accounts and permissions

- Villagers register with a mobile number and ward number, can edit those profile details, read announcements, submit private complaints, and chat directly with the Gram Panchayat administrator from the **प्रशासकाशी चॅट** tab.
- The seeded Gram Panchayat administrator can publish, edit, and delete announcements, attach photos to programs and news, view registered villagers' contact details in the **गावकरी माहिती** tab, see all complaints, reply in complaint chats, and open a private chat with any registered villager.
- Login and registration share a role dropdown. New registrations are always villagers; choosing administrator directs the user to the fixed administrator login.
- Resolving a complaint closes its chat: both the API and the UI reject further messages.
- The administrator username is `Masuchiwadi`. Its password is stored in the ignored `backend/local-secrets.properties`; copy `backend/local-secrets.example.properties` and set the password there before starting the API on a fresh checkout. Passwords are hashed before being saved to the database.

Each village chat is visible only to that villager and the administrator. The chat tab shows a count of unread incoming messages and marks them read when the conversation is open. Complaints and their chats are visible only to the reporter and the administrator. New messages appear in the app within a few seconds; no email or SMS forwarding is configured.

For a same-Wi-Fi demonstration, start Vite with `npm.cmd run dev -- --host 0.0.0.0` and open the computer's LAN address on the port printed by Vite from another phone. Villagers can register in the app; the administrator account is fixed.

## Village updates and complaints

Updates: चांगली बातमी · दुःखद वार्ता · पाणीपुरवठा · वीजपुरवठा · कार्यक्रम · इतर सूचना

Residents can use the separate **ग्रामपंचायत तक्रार** tab to report water, electricity, road, drainage, cleanliness, streetlight, or other issues. Reports are saved in the same H2 database and shown only to the reporter and the administrator. Gram Panchayat representatives need access to the app to see new reports.

The starter has no real village schedule or seeded announcements. Add only confirmed information before sharing an update with villagers. Only the administrator can publish village-wide updates.
