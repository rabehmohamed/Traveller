const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');

const login = async (email , password) => {
    try {
    const res = await axios({
        method : 'POST',
        url : 'http://127.0.0.1:5000/api/v1/users/login',
        data : {
            email ,
            password 
        }
    }); 

    if(res.data.status === 'success'){
        alert('Logged in successfully');
        window.setTimeout(()=> {
            location.assign('/');
        }, 300)
    }
    }catch(err){
        alert(err.response.data.message);
    }
};

const logout = async () => {
    try {
        const res = await axios ({
            method : 'POST',
            url : 'http://127.0.0.1:5000/api/v1/users/logout',
        });
        if(res.data.status === 'success') location.reload(true);
    }
    catch(err){
        alert("error , try again!")
    }
};

if (loginForm){
    loginForm.addEventListener('submit' , e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email,password);
    });
}

if(logOutBtn){
    logOutBtn.addEventListener('click' , logout);
}
/* document.querySelector('.form').addEventListener('submit' , e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email,password);
}); */

//document.querySelector('.nav__el--logout').addEventListener('click' , logout);

