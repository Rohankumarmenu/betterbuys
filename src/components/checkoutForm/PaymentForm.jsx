import React from 'react'
import { Typography, Button, Divider } from '@material-ui/core';
import { Elements, CardElement, ElementsConsumer } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Review from './Review'

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = ({checkoutToken, shippingData, backStep, onCaptureCheckout, nextStep, timeOut}) => {

  const handleSubmit = async (event, elements, stripe) => {
    event.preventDefault();
      
    if(!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    const {error, paymentMethod} = await stripe.createPaymentMethod({type: 'card', card: cardElement});

    if(error){
        console.log(error);
        return;
      }

      try {
        const orderData = {
          line_items: checkoutToken.live.line_items,
          customer: {firstname: shippingData.firstname, lastname: shippingData.lastname, email: shippingData.email},
          shipping: {
            name: "Primary",
            street: shippingData.address,
            town_city: shippingData.city,
            postal_zip_code: shippingData.zip,
            country_state: shippingData.shippingSubdivision,
            country: shippingData.shippingCountry
          },
          fulfillment: {shipping_method: shippingData.shippingOption},
          payment: {
            gateway: 'stripe',
            stripe: {
              payment_method_id: paymentMethod.id,
            },
          },
        }
        onCaptureCheckout(checkoutToken.id, orderData);
        timeOut();
        nextStep();
    
        console.log(orderData);
        return;
      } catch (response) {
        if (response.statusCode !== 402 || response.data.error.type !== 'requires_verification') {
          console.log(response);
          return;
        }
      
        const cardActionResult = await stripe.handleCardAction(response.data.error.param)
      
        if (cardActionResult.error) {
          alert(cardActionResult.error.message);
          return;
        }
        try {
          const orderData = {
            payment: {
              gateway: 'stripe',
              stripe: {
                payment_intent_id: cardActionResult.paymentIntent.id,
              },
            },
          }
          onCaptureCheckout(checkoutToken.id, orderData);
          timeOut();
          nextStep();
      
          console.log(orderData);
          return;
        } catch (response) {
          console.log(response);
          alert(response.message);
        }
      }    
  }

  return (
    <>
      <Review checkoutToken={checkoutToken} />
      <Divider />
      <Typography variant="h6" gutterBottom style={{ margin: '20px 0' }}>Payment method</Typography>
      <Elements stripe={stripePromise}>
        <ElementsConsumer>{({ elements, stripe }) => (
          <form onSubmit={(e) => handleSubmit(e, elements, stripe)}>
            <CardElement />
            <br /> <br />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={backStep}>Back</Button>
              <Button type="submit" variant="contained" disabled={!stripe} color="primary">
                Pay {checkoutToken.live.subtotal.formatted_with_symbol}
              </Button>
            </div>
          </form>
        )}
        </ElementsConsumer>
      </Elements>
    </>
  )
}


export default PaymentForm