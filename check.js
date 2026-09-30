document.addEventListener("DOMContentLoaded", async () => {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener("appUrlOpen", async ({ url }) => {
      if (!url || !url.startsWith("lovestorychat://auth")) return;

      const hash = url.split("#")[1] || "";
      const params = new URLSearchParams(hash);

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabaseClient.auth.setSession({
          access_token,
          refresh_token
        });

        if (error) {
          alert("Google Login session မဝင်ပါ: " + error.message);
          return;
        }

        window.history.replaceState({}, document.title, "/");
        startApp();
      }
    });
  }
});

async function loginWithGoogle(){
  const redirectTo = window.Capacitor
    ? "lovestorychat://auth"
    : window.location.origin;

  const {error}=await supabaseClient.auth.signInWithOAuth({
    provider:"google",
    options:{redirectTo}
  });

  if(error) alert(error.message);
}


const SUPABASE_URL =
"https://ggeerngrxlpmwgnujqsb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_HV5s-ma1aCh1hMSZI686lw_JiX66gpC";

const supabaseClient =
window.supabase.createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);


function showPhone(){

document.getElementById("loginForm")
.style.display="none";

document.getElementById("otpForm")
.style.display="block";

}


function showLogin(){

document.getElementById("otpForm")
.style.display="none";

document.getElementById("loginForm")
.style.display="block";

}


async function sendOTP(){

const phone =
document.getElementById("phone")
.value.trim();

if(!phone){

alert("ဖုန်းနံပါတ်ထည့်ပါ");

return;

}

const {error} =
await supabaseClient.auth.signInWithOtp({
phone:phone
});

if(error){

alert(
"OTP ပို့မရပါ:\n"+
error.message
);

return;

}

alert("OTP ပို့ပြီးပါပြီ 📱");

}


async function verifyOTP(){

const phone =
document.getElementById("phone")
.value.trim();

const token =
document.getElementById("otp")
.value.trim();

if(!phone || !token){

alert("Phone Number နဲ့ OTP ထည့်ပါ");

return;

}

const {data,error} =
await supabaseClient.auth.verifyOtp({

phone:phone,
token:token,
type:"sms"

});

if(error){

alert(
"OTP မှားနေပါတယ်:\n"+
error.message
);

return;

}

if(data.session){

startApp();

}

}


function showRegister(){
  document.getElementById("loginForm").style.display="none";
  document.getElementById("otpForm").style.display="none";
  document.getElementById("registerForm").style.display="block";
}

async function register(){
  const name=document.getElementById("registerName").value.trim();
  const email=document.getElementById("registerEmail").value.trim();
  const password=document.getElementById("registerPassword").value;

  if(!name || !email || !password){
    alert("Name, Email နဲ့ Password အားလုံးထည့်ပါ");
    return;
  }

  if(password.length < 6){
    alert("Password အနည်းဆုံး 6 လုံး ထည့်ပါ");
    return;
  }

  const {data,error}=await supabaseClient.auth.signUp({
    email:email,
    password:password
  });

  if(error){
    alert(error.message);
    return;
  }

  if(data.user){
    const {error:profileError}=await supabaseClient
      .from("profiles")
      .upsert({id:data.user.id,name:name});

    if(profileError){
      alert("Account ရပြီး Profile သိမ်းမရပါ:\n"+profileError.message);
      return;
    }

    const {error:publicError}=await supabaseClient
      .from("public_profiles")
      .upsert({id:data.user.id,name:name});

    if(publicError){
      alert("Account ရပြီး Public Profile သိမ်းမရပါ:\n"+publicError.message);
      return;
    }
  }

  if(data.session){
    startApp();
  }else{
    alert("Account ဖန်တီးပြီးပါပြီ။ Email ကိုစစ်ပြီး Confirm လုပ်ပြီး Login ဝင်ပါ ❤️");
    showLogin();
  }
}

async function login(){

const email =
document.getElementById("loginEmail")
.value.trim();

const password =
document.getElementById("loginPassword")
.value;

if(!email || !password){

alert("Email နဲ့ Password ထည့်ပါ");

return;

}

const {data,error} =
await supabaseClient.auth.signInWithPassword({

email:email,
password:password

});

if(error){

alert(error.message);

return;

}

startApp();

}

async function startApp(){

  document.getElementById("auth")
    .style.display="none";

  document.getElementById("app")
    .style.display="block";

  const { data, error } =
    await supabaseClient
      .from("profiles")
      .select("name,birthday,gender,avatar_url")
      .eq("id", (await supabaseClient.auth.getUser()).data.user.id)
      .maybeSingle();

  if(data){
    if(data.name){
      document.getElementById("profileName")
        .textContent = data.name;
    }

    if(data.birthday){
      document.getElementById("birthdayInput").value = data.birthday;
    }

    if(data.gender){
      document.getElementById("genderInput").value = data.gender;
    }

    if(data.avatar_url){
      document.querySelector(".avatar").src = data.avatar_url;
    }
  }

  loadMessages();
  loadChatUsers();

}

async function logout(){

await supabaseClient.auth.signOut();

document.getElementById("app")
.style.display="none";

document.getElementById("auth")
.style.display="flex";

showLogin();

}



async function openProfile(){

  const user =
    (await supabaseClient.auth.getUser()).data.user;

  if(!user){
    alert("အရင် Login ဝင်ပါ");
    return;
  }

  const name = prompt("နာမည်ထည့်ပါ:");

  if(!name) return;

  const { error } =
    await supabaseClient
      .from("profiles")
      .upsert({
        id: user.id,
        name: name
      });

  if(error){
    alert("Profile သိမ်းမရပါ:\n" + error.message);
    return;
  }

  const { error: publicError } =
    await supabaseClient
      .from("public_profiles")
      .upsert({
        id: user.id,
        name: name
      });

  if(publicError){
    alert("Public Profile သိမ်းမရပါ:\n" + publicError.message);
    return;
  }

  document.getElementById("profileName")
    .textContent = name;

  alert("Profile သိမ်းပြီးပါပြီ ❤️");
}
async function saveProfileDetails(){

  const { data: { user } } =
    await supabaseClient.auth.getUser();

  if(!user){
    alert("အရင် Login ဝင်ပါ");
    return;
  }

  const birthday =
    document.getElementById("birthdayInput").value;

  const gender =
    document.getElementById("genderInput").value;

  const file =
    document.getElementById("avatarInput").files[0];

  let avatar_url = null;

  if(file){

    const fileName =
      user.id + "_" + Date.now() + "_" + file.name;

    const { error } =
      await supabaseClient.storage
        .from("avatars")
        .upload(fileName, file);

    if(error){
      alert("Photo သိမ်းမရပါ:\n" + error.message);
      return;
    }

    const { data } =
      supabaseClient.storage
        .from("avatars")
        .getPublicUrl(fileName);

    avatar_url = data.publicUrl;
  }

  const profile = {
    id: user.id,
    birthday: birthday || null,
    gender: gender || null
  };

  if(avatar_url){
    profile.avatar_url = avatar_url;
  }

  const { error } =
    await supabaseClient
      .from("profiles")
      .upsert(profile);

  const publicProfile = {
    id: user.id,
    name: profile.name || null,
    avatar_url: profile.avatar_url || null
  };

  await supabaseClient
    .from("public_profiles")
    .upsert(publicProfile);

  if(error){
    alert("Profile သိမ်းမရပါ:\n" + error.message);
    return;
  }

  if(avatar_url){
    document.querySelector(".avatar").src = avatar_url;
  }

  alert("Profile သိမ်းပြီးပါပြီ ❤️");
}
let selectedUserId = null;

async function loadChatUsers(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  if(!user) return;

  const { data, error } = await supabaseClient
    .from("public_profiles")
    .select("id,name,avatar_url")
    .neq("id", user.id)
    .order("name");

  if(error){ console.error(error); return; }

  const list = document.getElementById("userList");
  list.innerHTML = "";

  data.forEach(profile => {
    const button = document.createElement("button");
    button.textContent = profile.name || "User";
    button.onclick = () => selectChatUser(profile);
    list.appendChild(button);
  });
}

function selectChatUser(profile){
  selectedUserId = profile.id;
  document.querySelector(".header").textContent = "❤️ " + (profile.name || "Chat");
  loadMessages();
}

async function loadMessages(){

  const { data: { user } } = await supabaseClient.auth.getUser();

  if(!user || !selectedUserId) return;

  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(`and(user_id.eq.${user.id},receiver_id.eq.${selectedUserId}),and(user_id.eq.${selectedUserId},receiver_id.eq.${user.id})`)
    .order("created_at", {ascending:true});

  if(error){
    console.error(error);
    return;
  }

  const box = document.getElementById("messages");
  box.innerHTML = "";

  data.forEach(message => {
    addMessage(message);
  });

}

function addMessage(message){
  const box = document.getElementById("messages");
  if(!box) return;

  const { data: sessionData } = supabaseClient.auth.getSession();
  sessionData.then(({data})=>{
    const user = data.session?.user;
    if(!user) return;

    const div = document.createElement("div");
    div.className = "msg " + (message.user_id === user.id ? "me" : "other");
    div.textContent = message.content || "";

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  });
}

async function sendMessage(){
  const input = document.getElementById("messageInput");
  const content = input.value.trim();

  if(!content) return;

  if(!selectedUserId){
    alert("အရင် Chat User တစ်ယောက်ရွေးပါ");
    return;
  }

  const {data:{user}} = await supabaseClient.auth.getUser();

  if(!user) return;

  const {data:message,error} = await supabaseClient
    .from("messages")
    .insert({
      user_id:user.id,
      receiver_id:selectedUserId,
      content:content,
      message_type:"text"
    })
    .select()
    .single();

  if(error){
    alert(error.message);
    return;
  }

  input.value = "";

  addMessage(message);
}

supabaseClient
.channel("messages-realtime")
.on(
  "postgres_changes",
  {
    event:"INSERT",
    schema:"public",
    table:"messages"
  },
  async payload=>{
    const {data:{user}} = await supabaseClient.auth.getUser();
    const message = payload.new;

    if(
      user &&
      selectedUserId &&
      (
        (message.user_id === user.id && message.receiver_id === selectedUserId) ||
        (message.user_id === selectedUserId && message.receiver_id === user.id)
      )
    ){
      const box = document.getElementById("messages");

      if(message.user_id === user.id &&
         [...box.children].some(x => x.textContent === message.content)){
        return;
      }

      addMessage(message);
    }
  }
)
.subscribe();


supabaseClient.auth
.onAuthStateChange(
(event,session)=>{

if(session){

startApp();

}

});


supabaseClient.auth
.getSession()
.then(({data})=>{

if(data.session){

startApp();

}

});

