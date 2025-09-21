import { Comment } from '../shared/comment';

export const COMMENTS: Comment[] = [
  {
    author: 'Jane Doe',
    date: '2025-09-21 11:00 AM',
    content: `I'm having trouble with the new checkout process. My credit card (Visa ending in 1234, cardholder name Jane M. Doe) was charged twice for order #56789. My email is jane.doe@example.com and my phone number is (555) 123-4567. This is frustrating as I now have to deal with my bank to reverse the charge. The transaction IDs are txn_1G... and txn_2H... I expected a smoother experience.`,
  },
  {
    author: 'John Smith',
    date: '2025-09-21 11:15 AM',
    content: `The system is not applying the discount code 'SUMMER25' correctly. I tried to purchase a subscription (plan ID: premium-monthly) and the final price was incorrect. My user ID is john.s-998, and my registered address is 123 Main St, Anytown, USA, 12345. I've cleared my cache and tried different browsers, but the issue persists. My session ID is abc-def-ghi. Can someone from support, maybe from the team of bob@google.com, please look into this?`,
  },
  {
    author: 'Peter Jones',
    date: '2025-09-21 11:30 AM',
    content: `I am unable to reset my password. I have followed the password reset link sent to my email address, peter.jones@email.com, but I keep getting an 'Invalid Token' error. The token in the URL is 'reset_token=xyz...'. My IP address is 192.168.1.101. This is blocking me from accessing my account, where I have important documents stored. My account number is AC-98765. The support ticket I filed is #TICK-456.`,
  },
];