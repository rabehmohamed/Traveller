import axios from 'axios';
const stripe = stripe('pk_test_51NwGLJDIEtIo4eOFNxNu8IJYsgsX1tBpcUXczdxPmT26K49b3A26BNaMw5YXLX6aCV16qpWXFxloD8zlqZCsCdRp00orYpWIhg');
const bookBtn = document.getElementById('book-tour');

export const bookTour = async tourId => {
    try{
        //1) Get checkout session for API
        const session = await axios(`http://127.0.0.1:5000/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);
        //2)Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
          });
    }
    catch(err){
        console.log(err);
    }
}


if(bookBtn)
    bookBtn.addEventListener('click' , e => {
        e,target.textContent = 'Processing...';
        const tourId = e.target.dataset;
        bookTour(tourId);
    });