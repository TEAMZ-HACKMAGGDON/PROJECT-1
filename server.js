const express=require('express');
const bodyParser=require('body-parser');
const app=express();
const port=8000;
app.use(bodyParser.json());
const {MongoClient}=require('mongodb') 
const path = require('path')  
const fs = require('fs')
const fspromises = require('fs').promises 
const client=new MongoClient("mongodb://localhost:27017/") 
const crypto = require('crypto');
const cors = require('cors');;
app.use(cors());
app.use(bodyParser.json());
function find_role(role) {
    switch(role) {
        case '1': return 'woman';
        case '2': return 'kids'; 
        case '3': return 'doctor';
        case '4': return 'labs';
        case '5': return 'pharmacy';
        default: return null;
    }
}
class Login {
    async signUp(client, role, firstName, lastName, email, password) {
        const db = client.db("Project");
        const conn = db.collection(find_role(role));
        let hash = crypto.createHash('sha256').update(password).digest('hex');
        await conn.insertOne({ firstName, lastName, email, password: hash });
    }

    async login(client, role, email, password) {
        const db = client.db("Project");
        const conn = db.collection(find_role(role));
        console.log(email);3
        const user = await conn.findOne({ email });
        //if (!user) return false;
        const newhash = crypto.createHash('sha256').update(password).digest('hex');
        console.log(newhash);
        console.log(user.password);
        return newhash === user.password;
    }

    async forgotPassword(client, role, email, newPassword, confirmPassword) {
        const db = client.db("Project");
        const conn = db.collection(find_role(role));
        const user = await conn.findOne({ email });
       // if (!user) return null;
        if (newPassword !== confirmPassword) return null;
        let hash = crypto.createHash('sha256').update(newPassword).digest('hex');
        await conn.updateOne({ email }, { $set: { password: hash } });
        return 1;
    }
}
const login = new Login(); 
app.get('/doctor',(req,res) =>  
{
    res.sendFile(path.join(__dirname,'index.html')) ;
});  

app.post('/doclogin', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(username);
        console.log(password);
        console.log(Attempting login for username: ${username}); 
        const loginResult = await login.login(client, '3', username, password);

        if (loginResult) {
            console.log('Login successful');
            res.status(200).send("Login successful");
        } else {
            console.log('Login failed');
            res.status(401).send("Login failed");
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/docsignup', async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        await login.signUp(client, '3', firstname, lastname, email, password);
        res.status(201).send("Signup successful");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Internal server error");
    }
});

app.post('/docforgetpass', async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (await login.forgotPassword(client, '3', email, newPassword, confirmPassword)) {
            res.status(200).send("Password reset successful");
        } else {
            res.status(400).send("Password reset failed");
        }
    } catch (error) {
        console.error("Error during password reset:", error);
        res.status(500).send("Internal server error");
    }
});

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
    } catch (err) {
        console.error(err);
    }
}

connectToMongoDB();
app.listen(port, () => {
    console.log(Server is running at http://localhost:${port});
});

class Profile{
    async view(client,role,id) {
        const db = client.db('Project');
        const c = db.collection(find_role(role));
        console.log(find_role(role))
        const f = await c.findOne({email:id}, { projection: { _id: 0,password:0} });
        console.log(f)
        return f;
    }

    async updateUser(client, role, email, updateData) {
        // Debugging statement
        const db = client.db("Project");
        const conn = db.collection(find_role(role));
    
        const result = await conn.updateOne({ email: email }, { $set: updateData });
        if (result.matchedCount === 0) {
            console.log('User not found'); // Debugging statement
            return null;
        }
        return 1;
    }
    

    async changePassword(client,role, email, oldPassword, newPassword, confirmPassword) {
        const db = client.db("Project");
        const conn = db.collection(find_role(role));

        const user = await conn.findOne({ email });
        if (!user) {
            console.log('User not found');
            return null;
        }

        const newhash = crypto.createHash('sha256').update(oldPassword).digest('hex');
        if (newhash !== user.password) {
            console.log('Old password is incorrect');
            return null;
        }

        if (newPassword !== confirmPassword) {
            console.log("Passwords do not match");
            return null;
        }

        let hash = crypto.createHash('sha256').update(newPassword).digest('hex');
        await conn.updateOne({ email }, { $set: { password: hash } });
        console.log('Password updated successfully');
        return 1;
    }

}
app.get('/profile',(req,res) =>  
    {
        res.sendFile(path.join(__dirname,'profile.html')) ;
    });  
app.get('/viewProfile', async (req, res) => {
        const email = req.query.email; // Assuming profile lookup by email
       
        if (!email) {
            return res.status(400).send('Email query parameter is required');
        }
        try {
            const db = client.db('Project');
            const profiles = db.collection(find_role(role));
            if(await login.viewProfile(client, '3', email))
                {
                    res.status(200).send("Viewed successful");
                } 
                else{
                    res.status(400).send('Oops , could not connected');
                } 
            const profile = await profiles.findOne({ email });
            console.log(profile)
    
            if (!profile) {
                return res.status(404).send('Profile not found');
            }
        
            // Send profile data 
            alert("Profile viewed successfully "); 
            console.log("Profile viewed ");
            res.json(loginResult);  
        } catch (error) {
            console.error('Error retrieving profile:', error);
            res.status(500).send('Internal server error');
        }
    }); 
app.post('/updateProfile', async (req, res) => {
    try {
        const { role, email, updateData } = req.body;
        await client.connect();
        const updateResult = await profile.updateUser(client, role, email, updateData);
        res.send(updateResult ? 'Profile updated successfully' : 'User not found');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Error updating profile');
    } finally {
        await client.close();
    }
});

// Route to handle changing the password
app.post('/changePassword', async (req, res) => {
    try {
        const { role, email, oldPassword, newPassword, confirmPassword } = req.body;
        await client.connect();
        const passwordChangeResult = await profile.changePassword(client, role, email, oldPassword, newPassword, confirmPassword);
        res.send(passwordChangeResult ? 'Password updated successfully' : 'Password update failed');
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).send('Error changing password');
    } finally {
        await client.close();
    }
});

class Woman {
    async incGest(client) {
        const db = client.db("Project");
        const conn = db.collection('woman');
        const cursor = await conn.find({}, { projection: { email: 1, gestationalAge: 1 } });

        const users = await cursor.toArray(); // Convert cursor to an array

        for (const user of users) {
            if (user.gestationalAge !== null) {
                const wk = user.gestationalAge + 1;
                const updateData = { gestationalAge: wk };
                await conn.updateOne({ email: user.email }, { $set: updateData });
            }
        }
    }
    async remainder(client) {
        const weekly_reminders = [
            // First Trimester (Weeks 1-12)
            ["Start Prenatal Vitamins", "Begin tracking your cycle", "Incorporate leafy greens into meals"],  // Week 1
            ["Explore light exercise options like walking or yoga", "Avoid alcohol and caffeine", "Schedule a pre-conception check-up if planning"],  // Week 2
            ["Research prenatal vitamins with folic acid", "Start a healthy meal plan", "Stay hydrated with plenty of water"],  // Week 3
            ["Consider a pregnancy test if you suspect", "Maintain a stress-free environment", "Avoid environmental toxins"],  // Week 4
            
            // Weeks 5-8
            ["Schedule your first prenatal appointment", "Start a pregnancy journal", "Consider telling close family and friends"],  // Week 5
            ["Learn about early pregnancy symptoms", "Start reading about pregnancy nutrition", "Join an online pregnancy community"],  // Week 6
            ["Be mindful of morning sickness triggers", "Consider switching to decaf", "Get plenty of rest"],  // Week 7
            ["Begin tracking your symptoms", "Start thinking about prenatal care options", "Explore maternity clothing options"],  // Week 8
            
            // Weeks 9-12
            ["Attend your first prenatal visit", "Discuss genetic screening options with your doctor", "Continue exercising, adjusting intensity as needed"],  // Week 9
            ["Start considering baby names", "Learn about prenatal vitamins and their benefits", "Focus on balanced nutrition"],  // Week 10
            ["Research prenatal classes in your area", "Begin a gentle exercise routine", "Stay hydrated throughout the day"],  // Week 11
            ["Begin looking into prenatal yoga", "Discuss any concerns with your healthcare provider", "Ensure adequate sleep for both you and the baby"],  // Week 12
            
            // Second Trimester (Weeks 13-28)
            ["Schedule your next prenatal appointment", "Begin thinking about nursery themes", "Discuss any travel plans with your doctor"],  // Week 13
            ["Look into second-trimester screenings", "Start a baby registry", "Consider joining a prenatal exercise class"],  // Week 14
            ["Begin to feel more energized—use it to prepare for the baby", "Plan a babymoon", "Discuss maternity leave plans with your employer"],  // Week 15
            ["Schedule your anatomy scan", "Start organizing your home for the baby", "Look into prenatal massage therapy"],  // Week 16
            
            // Weeks 17-20
            ["Prepare for your anatomy scan this week", "Consider finding a pediatrician", "Start a baby bump photo series"],  // Week 17
            ["Begin planning your baby shower", "Look into childbirth classes", "Discuss birthing options with your doctor"],  // Week 18
            ["Research baby gear essentials", "Plan for maternity and paternity leave", "Start thinking about a birth plan"],  // Week 19
            ["Enjoy the mid-pregnancy glow!", "Review your diet and adjust if needed", "Stay active with prenatal exercises"],  // Week 20
            
            // Weeks 21-24
            ["Schedule your glucose tolerance test", "Look into cord blood banking", "Consider joining a parenting group"],  // Week 21
            ["Begin baby-proofing your home", "Update your baby registry as needed", "Start discussing postpartum support"],  // Week 22
            ["Attend a prenatal class", "Continue with prenatal exercises", "Start planning for your maternity photoshoot"],  // Week 23
            ["Look into breastfeeding resources", "Check in with your doctor about any new symptoms", "Start setting up the nursery"],  // Week 24
            
            // Weeks 25-28
            ["Discuss your birth plan with your healthcare provider", "Consider taking a hospital tour", "Think about baby names again—finalize your list"],  // Week 25
            ["Begin practicing breathing exercises for labor", "Look into different birthing positions", "Plan for your baby shower"],  // Week 26
            ["Schedule your Rh factor test if needed", "Consider starting a birth playlist", "Continue regular prenatal visits"],  // Week 27
            ["Review signs of labor with your doctor", "Start packing your hospital bag", "Install the baby’s car seat in your car"],  // Week 28
            
            // Third Trimester (Weeks 29-40)
            ["Begin counting baby’s kicks daily", "Take a hospital tour if you haven’t yet", "Finalize your baby registry"],  // Week 29
            ["Plan your postpartum care—ask for help", "Review your birth plan with your healthcare provider", "Look into newborn care classes"],  // Week 30
            ["Attend a breastfeeding class", "Prepare the nursery", "Relax and practice mindfulness techniques"],  // Week 31
            ["Finish packing your hospital bag", "Check in with your doctor about any concerns", "Enjoy a relaxing date night"],  // Week 32
            
            ["Install and inspect the baby’s car seat", "Review signs of labor", "Stay active with light exercises"],  // Week 33
            ["Finalize your birth plan and share it with your birth team", "Continue with prenatal appointments", "Consider a pedicure for relaxation"],  // Week 34
            ["Begin preparing for labor—review breathing exercises", "Ensure your support person is ready", "Finish setting up the nursery"],  // Week 35
            ["Prepare for labor—keep your hospital bag ready", "Install any last-minute baby gear", "Stay calm and focused"],  // Week 36
            
            ["Monitor signs of labor closely", "Take it easy—rest as much as possible", "Double-check your hospital bag"],  // Week 37
            ["Stay calm and patient—baby will arrive soon", "Review your birth plan one last time", "Enjoy final preparations"],  // Week 38
            ["Be ready for labor at any time", "Stay in close contact with your healthcare provider", "Focus on relaxation and breathing"],  // Week 39
            ["Congratulations! Prepare to welcome your baby", "Focus on labor signs and stay in touch with your doctor", "Rest and enjoy the last moments of pregnancy"]  // Week 40
        ];
    
        const db = client.db("Project");
        const conn = db.collection('woman');
        const cursor = await conn.find({ gestationalAge: { $ne: null } }, { projection: { email: 1, gestationalAge: 1, activeReminders: 1 } });
        const users = await cursor.toArray();
    
        for (const user of users) {
            const wk = user.gestationalAge;
        
            // Ensure wk is within bounds of weekly_reminders array
            if (wk >= 1 && wk <= weekly_reminders.length) {
                const remindersForWeek = weekly_reminders[wk - 1];
        
                // Replace the active reminders with the current week's reminders
                const updateData = {
                    active_remainder: remindersForWeek
                };
        
                await conn.updateOne({ email: user.email }, { $set: updateData });
            }
        }
        
    }

    async conference(client, email) {
        const db = client.db("Project");
        const wom = db.collection('woman');
    
        const cursor = await wom.findOne({ email: email }, { projection: { doctor_name: 1, doctor_id: 1 } });
    
        if (!cursor) {
            console.log('No woman found with the provided email.');
            return;
        }
    
        const doc = db.collection('doctor');
        const details = await doc.findOne({ doctor_id: cursor.doctor_id });
    
        if (!details) {
            console.log('No doctor found with the provided doctor_id.');
            return;
        }
    
        if (details.active) {
            await doc.updateOne(
                { doctor_id: cursor.doctor_id },
                { $push: { requests: email } }
            );
    
            // Introduce a delay (if necessary)
            await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes delay
    
            const rep = await doc.findOne({ doctor_id: cursor.doctor_id });
            if (rep.meet === "true") {
                await wom.updateOne({ email: email }, { $set: { meet: true } });
                return true;
            }
        } else {
            const activeDoctors = await doc.find(
                { specialization: details.specialization, active: true },
                { projection: { email: 1, doctor_id: 1 } }
            ).toArray();
    
            for (const activeDoctor of activeDoctors) {
                await doc.updateOne(
                    { doctor_id: activeDoctor.doctor_id },
                    { $push: { requests: { email: email, request: "Request for video conference", acceptance: false } } }
                );
    
                // Introduce a delay (if necessary)
                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes delay
    
                const rep = await doc.findOne({ doctor_id: activeDoctor.doctor_id });
                if (rep.meet === "true") {
                    await wom.updateOne({ email: email }, { $set: { meet: true } });
                    return true;
                }
            }
        }
        return false;
    }
    
    
}
app.get('/women',(req,res) =>  
    {
        res.sendFile(path.join(__dirname,'women.html')) ;
    }); 
    app.post('/womenlogin', async (req, res) => {
        try {
            const { username, password } = req.body;
            console.log(username);
            console.log(password);
            console.log(Attempting login for username: ${username}); 
            const loginResult = await login.login(client, '1', username, password);
    
            if (loginResult) {
                console.log('Login successful');
                res.status(200).send("Login successful");
            } else {
                console.log('Login failed');
                res.status(401).send("Login failed");
            }
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).send("Internal Server Error");
        }
    });
    
    
    app.post('/womensignup', async (req, res) => {
        try {
            const { firstname, lastname, email, password } = req.body;
            await login.signUp(client, '1', firstname, lastname, email, password);
            res.status(201).send("Signup successful");
        } catch (error) {
            console.error("Error during signup:", error);
            res.status(500).send("Internal server error");
        }
    });
    
    app.post('/womenforgetpass', async (req, res) => {
        try {
            const { email, newPassword, confirmPassword } = req.body;
            if (await login.forgotPassword(client, '1', email, newPassword, confirmPassword)) {
                res.status(200).send("Password reset successful");
            } else {
                res.status(400).send("Password reset failed");
            }
        } catch (error) {
            console.error("Error during password reset:", error);
            res.status(500).send("Internal server error");
        }
    });
    

app.get('/incGest', async (req, res) => { 
    try {
        const woman = new Woman();
        await woman.incGest(client);
        res.status(200).send('Gestational age incremented successfully for all users.');
    } catch (error) {
        console.error('Error in incGest:', error);
        res.status(500).send('An error occurred while incrementing gestational age.');
    }
});
app.get('/remainder', async (req, res) => {
    try {
        const woman = new Woman();
        await woman.remainder(client);
        res.status(200).send('Reminders updated successfully.');
    } catch (error) {
        console.error('Error in remainder:', error);
        res.status(500).send('An error occurred while updating reminders.');
    }
});
app.get('/conference', async (req, res) => {
    const { email } = req.query;  // Extract email from query parameters
    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        const woman = new Woman();
        const success = await woman.conference(client, email);
        if (success) {
            res.status(200).send('Conference request handled successfully.');
        } else {
            res.status(200).send('No active doctors available for the conference.');
        }
    } catch (error) {
        console.error('Error in conference:', error);
        res.status(500).send('An error occurred while handling the conference request.');
    }
});


class Child{
    async remainder(client) {
            const weekly_reminders = [
            // First Month (Weeks 1-4) 
            ["Schedule the baby's first pediatric visit", "Focus on breastfeeding or formula feeding", "Ensure skin-to-skin contact with the baby"],  // Week 1
            ["Monitor the baby’s weight gain", "Keep the umbilical cord area clean and dry", "Bond with your baby through gentle touch and talk"],  // Week 2
            ["Look for the first smiles", "Practice tummy time daily", "Keep track of feedings and diaper changes"],  // Week 3
            ["Ensure the baby’s hearing is screened", "Introduce different textures and sounds", "Continue with regular pediatric visits"],  // Week 4
        
            // Second Month (Weeks 5-8)
            ["Schedule the baby's two-month vaccinations", "Continue tummy time to strengthen muscles", "Engage the baby with colorful toys"],  // Week 5
            ["Notice increased alertness and responsiveness", "Begin introducing simple songs and nursery rhymes", "Monitor the baby’s sleep patterns"],  // Week 6
            ["Look for cooing sounds", "Gently move the baby’s legs during diaper changes", "Maintain a feeding and sleeping routine"],  // Week 7
            ["Ensure the baby is gaining weight steadily", "Encourage eye-tracking with toys", "Discuss any concerns with the pediatrician"],  // Week 8
        
            // Third Month (Weeks 9-12)
            ["Watch for first attempts at rolling over", "Introduce a baby-safe mirror for self-recognition", "Begin reading simple picture books"],  // Week 9
            ["Continue tummy time and increase its duration", "Engage the baby with high-contrast images", "Monitor developmental milestones"],  // Week 10
            ["Look for more smiles and social interactions", "Play peek-a-boo or other interactive games", "Ensure the baby is following objects with their eyes"],  // Week 11
            ["Schedule the baby's three-month check-up", "Discuss any sleep or feeding concerns with the doctor", "Encourage the baby to reach for toys"],  // Week 12
        
            // Fourth Month (Weeks 13-16)
            ["Expect increased drooling as teething may begin", "Introduce soft, chewable toys", "Continue regular tummy time"],  // Week 13
            ["Encourage the baby to roll from tummy to back", "Begin establishing a nap routine", "Engage the baby with different textures"],  // Week 14
            ["Monitor the baby's head control", "Provide plenty of floor time for exploration", "Read to the baby daily"],  // Week 15
            ["Notice the baby grasping objects more firmly", "Talk to the baby frequently to encourage language development", "Ensure the baby is on track with weight and height growth"],  // Week 16
        
            // Fifth Month (Weeks 17-20)
            ["Prepare for the baby’s first solid foods", "Continue offering plenty of tummy time", "Introduce the baby to new sounds and music"],  // Week 17
            ["Look for signs the baby is ready for solids", "Introduce single-ingredient purees", "Watch for rolling over from back to tummy"],  // Week 18
            ["Continue monitoring the baby's response to new foods", "Provide toys that encourage grasping and reaching", "Encourage sitting up with support"],  // Week 19
            ["Schedule the baby's six-month vaccinations", "Discuss introducing solid foods with the pediatrician", "Encourage babbling and cooing"],  // Week 20
        
            // Sixth Month (Weeks 21-24)
            ["Begin offering a variety of solid foods", "Watch for the baby’s first teeth emerging", "Continue practicing sitting up"],  // Week 21
            ["Introduce a sippy cup with water", "Provide a safe space for the baby to practice sitting and crawling", "Engage the baby with stacking toys"],  // Week 22
            ["Notice the baby showing preferences for certain foods", "Continue encouraging self-feeding", "Start baby-proofing your home"],  // Week 23
            ["Ensure the baby’s diet includes a variety of nutrients", "Look for the baby’s first attempts at crawling", "Maintain a consistent bedtime routine"],  // Week 24
        
            // Seventh Month (Weeks 25-28)
            ["Encourage the baby to explore their surroundings", "Introduce finger foods like soft fruits", "Begin teaching simple sign language like 'more' and 'all done'"],  // Week 25
            ["Expect increased mobility—crawling, scooting", "Provide plenty of opportunities for floor play", "Introduce the baby to different family members and friends"],  // Week 26
            ["Continue monitoring the baby’s food intake", "Encourage the baby to pull up to a standing position", "Read more complex picture books with the baby"],  // Week 27
            ["Schedule the baby's nine-month check-up", "Discuss sleep and feeding routines with the pediatrician", "Encourage the baby to say simple words"],  // Week 28
        
            // Eighth Month (Weeks 29-32)
            ["Notice the baby cruising along furniture", "Offer finger foods at each meal", "Continue practicing simple words and sign language"],  // Week 29
            ["Encourage independent play with toys", "Begin teaching the baby to wave and clap", "Look for signs of separation anxiety"],  // Week 30
            ["Expect more babbling and first words", "Engage the baby with interactive books", "Provide plenty of opportunities for safe exploration"],  // Week 31
            ["Continue offering a variety of solid foods", "Encourage the baby to mimic actions and sounds", "Begin transitioning to a more structured daily routine"],  // Week 32
        
            // Ninth Month (Weeks 33-36)
            ["Watch for more deliberate crawling and cruising", "Encourage the baby to feed themselves", "Introduce the baby to new environments and experiences"],  // Week 33
            ["Continue baby-proofing as mobility increases", "Offer a variety of toys that encourage problem-solving", "Maintain a consistent routine for meals and sleep"],  // Week 34
            ["Expect the baby to start standing independently", "Provide plenty of praise for new skills", "Continue reading daily and introducing new words"],  // Week 35
            ["Schedule the baby’s 12-month check-up and vaccinations", "Discuss the introduction of cow’s milk with the pediatrician", "Begin planning a first birthday celebration"],  // Week 36
        
            // Tenth Month (Weeks 37-40)
            ["Look for the baby’s first steps", "Continue offering balanced meals and snacks", "Encourage social interactions with other children"],  // Week 37
            ["Provide toys that encourage walking and movement", "Monitor the baby’s growth and development", "Continue practicing simple words and phrases"],  // Week 38
            ["Encourage the baby to climb and explore safely", "Offer a variety of textures and flavors in meals", "Engage in daily playtime and bonding activities"],  // Week 39
            ["Begin transitioning the baby to one nap per day", "Encourage the baby to communicate needs and desires", "Celebrate the baby’s first birthday with family and friends"],  // Week 40
        
            // Eleventh Month (Weeks 41-44)
            ["Continue encouraging walking and running", "Offer more complex toys and puzzles", "Begin introducing simple household chores for the baby to help with"],  // Week 41
            ["Watch for the baby’s vocabulary to expand", "Provide opportunities for the baby to interact with other children", "Continue a consistent routine for meals and sleep"],  // Week 42
            ["Encourage the baby’s independence with self-feeding", "Offer a variety of learning activities and games", "Celebrate the baby’s achievements with praise and encouragement"],  // Week 43
            ["Schedule the baby’s 15-month check-up", "Discuss any developmental concerns with the pediatrician", "Begin planning for the toddler stage"],  // Week 44
        
            // Twelfth Month (Weeks 45-48)
            ["Prepare for the baby’s transition to toddlerhood", "Introduce new foods and flavors", "Encourage the baby’s curiosity and exploration"],  // Week 45
            ["Watch for the baby’s growing independence", "Continue offering opportunities for learning and play", "Celebrate the baby’s first year with a special activity"],  // Week 46
            ["Ensure the baby is meeting developmental milestones", "Provide a safe and stimulating environment for growth", "Continue reading and introducing new words"],  // Week 47
            ["Celebrate the baby’s first birthday!", "Reflect on the past year and look forward to the toddler stage", "Plan for the next steps in the baby’s development"],  // Week 48
        ];
    
        const db = client.db("Project");
        const conn = db.collection('kids');
        const cursor = await conn.find({ weeks: { $ne: null } }, { projection: { email: 1, weeks: 1, activeRemainder: 1 } });
        const users = await cursor.toArray();
    
        for (const user of users) {
            const wk = user.weeks; 
        
            // Ensure wk is within bounds of weekly_reminders array
            if (wk >= 1 && wk <= weekly_reminders.length) {
                const remindersForWeek = weekly_reminders[wk - 1];
        
                // Replace the active reminders with the current week's reminders
                const updateData = {
                    activeRemainder: remindersForWeek
                };
        
                await conn.updateOne({ email: user.email }, { $set: updateData });
            }
        }
        
    }

    async incWeek(client) {
        const db = client.db("Project");
        const conn = db.collection('kids');
        const cursor = await conn.find({}, { projection: { email: 1, weeks: 1 } });

        const users = await cursor.toArray(); // Convert cursor to an array

        for (const user of users) {
            if (user.weeks !== null) {
                const wk = user.weeks + 1;
                const updateData = { weeks: wk };
            }
        }
    }

    async conference(client, email) {
        const db = client.db("Project");
        const wom = db.collection('kids');
    
        const cursor = await wom.findOne({ email: email }, { projection: { doctor_name: 1, doctor_id: 1 } });
    
        if (!cursor) {
            console.log('No woman found with the provided email.');
            return;
        }
    
        const doc = db.collection('doctor');
        const details = await doc.findOne({ doctor_id: cursor.doctor_id });
    
        if (!details) {
            console.log('No doctor found with the provided doctor_id.');
            return;
        }
    
        if (details.active) {
            await doc.updateOne(
                { doctor_id: cursor.doctor_id },
                { $push: { requests: email } }
            );
    
            // Introduce a delay (if necessary)
            await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes delay
    
            const rep = await doc.findOne({ doctor_id: cursor.doctor_id });
            if (rep.meet === "true") {
                await wom.updateOne({ email: email }, { $set: { meet: true } });
                return true;
            }
        } else {
            const activeDoctors = await doc.find(
                { specialization: details.specialization, active: true },
                { projection: { email: 1, doctor_id: 1 } }
            ).toArray();
    
            for (const activeDoctor of activeDoctors) {
                await doc.updateOne(
                    { doctor_id: activeDoctor.doctor_id },
                    { $push: { requests: { email: email, request: "Request for video conference", acceptance: false } } }
                );
    
                // Introduce a delay (if necessary)
                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes delay
    
                const rep = await doc.findOne({ doctor_id: activeDoctor.doctor_id });
                if (rep.meet === "true") {
                    await wom.updateOne({ email: email }, { $set: { meet: true } });
                    return true;
                }
            }
        }
        return false;
    }
}
app.get('/child',(req,res) =>  
    {
        res.sendFile(path.join(__dirname,'child.html')) ;
    }); 
app.post('/childlogin', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(username);
        console.log(password);
        console.log(Attempting login for username: ${username}); 
        const loginResult = await login.login(client, '2', username, password);

        if (loginResult) {
            console.log('Login successful');
            res.status(200).send("Login successful");
        } else {
            console.log('Login failed');
            res.status(401).send("Login failed");
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send("Internal Server Error");
    }
});


app.post('/childsignup', async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        await login.signUp(client, '2', firstname, lastname, email, password);
        res.status(201).send("Signup successful");
    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).send("Internal server error");
    }
});

app.post('/childforgetpass', async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (await login.forgotPassword(client, '2', email, newPassword, confirmPassword)) {
            res.status(200).send("Password reset successful");
        } else {
            res.status(400).send("Password reset failed");
        }
    } catch (error) {
        console.error("Error during password reset:", error);
        res.status(500).send("Internal server error");
    }
});


app.get('/remainder', async (req, res) => {
    try {
        const weekly_reminders = [
            // Your weekly_reminders data here...
        ];
        const db = client.db("Project");
        const conn = db.collection('kids');
        const cursor = await conn.find({ weeks: { $ne: null } }, { projection: { email: 1, weeks: 1, activeRemainder: 1 } }).toArray();

        for (const user of cursor) {
            const wk = user.weeks;

            if (wk >= 1 && wk <= weekly_reminders.length) {
                const remindersForWeek = weekly_reminders[wk - 1];
                await conn.updateOne({ email: user.email }, { $set: { activeRemainder: remindersForWeek } });
            }
        }
        res.send('Reminders updated successfully');
    } catch (error) {
        console.error('Error in remainder:', error);
        res.status(500).send('Error updating reminders');
    }
});

// Endpoint to increment week
app.get('/incWeek', async (req, res) => {
    try {
        const db = client.db("Project");
        const conn = db.collection('kids');
        const cursor = await conn.find({}, { projection: { email: 1, weeks: 1 } }).toArray();

        for (const user of cursor) {
            if (user.weeks !== null) {
                const wk = user.weeks + 1;
                await conn.updateOne({ email: user.email }, { $set: { weeks: wk } });
            }
        }
        res.send('Weeks incremented successfully');
    } catch (error) {
        console.error('Error in incWeek:', error);
        res.status(500).send('Error incrementing weeks');
    }
});

// Endpoint to request a conference
app.post('/conference', async (req, res) => {
    const email = req.body.email;

    if (!email) {
        return res.status(400).send('Email is required');
    }

    try {
        const db = client.db("Project");
        const conn = db.collection('kids');
        const user = await conn.findOne({ email: email }, { projection: { doctor_name: 1, doctor_id: 1 } });

        if (!user) {
            return res.status(404).send('No user found with the provided email');
        }
     
        const doc = db.collection('doctor');
        const details = await doc.findOne({ doctor_id: user.doctor_id });

        if (!details) {
            return res.status(404).send('No doctor found with the provided doctor_id');
        }

        if (details.active) {
            await doc.updateOne(
                { doctor_id: user.doctor_id },
                { $push: { requests: email } }
            );

            await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes delay

            const rep = await doc.findOne({ doctor_id: user.doctor_id });
            if (rep.meet === "true") {
                await conn.updateOne({ email: email }, { $set: { meet: true } });
                return res.send('Conference scheduled successfully');
            }
        } else {
            const activeDoctors = await doc.find(
                { specialization: details.specialization, active: true },
                { projection: { email: 1, doctor_id: 1 } }
            ).toArray();

            for (const activeDoctor of activeDoctors) {
                await doc.updateOne(
                    { doctor_id: activeDoctor.doctor_id },
                    { $push: { requests: { email: email, request: "Request for video conference", acceptance: false } } }
                );

                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // 5 minutes delay

                const rep = await doc.findOne({ doctor_id: activeDoctor.doctor_id });
                if (rep.meet === "true") {
                    await conn.updateOne({ email: email }, { $set: { meet: true } });
                    return res.send('Conference scheduled successfully');
                }
            }
        }

        res.send('No available doctors for the conference');
    } catch (error) {
        console.error('Error in conference:', error);
        res.status(500).send('Error scheduling conference');
    }
});
class Doctor{
    async patientList(client, email) {
        const db = client.db('Project');
        const doc = db.collection('doctor');
    
        const doctor = await doc.findOne({ email: email }, { projection: { consultationHistory: 1 } });
    
        if (doctor && doctor.consultationHistory) {
            const emailArray = doctor.consultationHistory.map(consultation => consultation.patemail);
            return emailArray;  
        } else {
            return [];  
        }
    }
    
} 
app.get('/patient-list',(req,res)=>
{
    res.sendFile(path.join(__dirname,'patientlist.html'));
    
}) 
app.get('/patientList', async (req, res) => {
    const email = req.query.email;
    if (!email) {
        return res.status(400).send('Email query parameter is required');
    }

    try {
        const doctor = new Doctor();
        const patients = await doctor.patientList(client, email); // Use client here
        res.json(patients);  
    } catch (error) {
        console.error('Error retrieving patient list:', error);
        res.status(500).send('Internal server error'); 
    }
});
module.exports = {Login,Woman,Child,Profile,Doctor};
