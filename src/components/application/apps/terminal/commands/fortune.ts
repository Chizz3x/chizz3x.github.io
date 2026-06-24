import { CommandBase, NCommandBase } from '../command-base';

const quotes = [
  'The best way to predict the future is to invent it. — Alan Kay',
  'Talk is cheap. Show me the code. — Linus Torvalds',
  'First, solve the problem. Then, write the code. — John Johnson',
  'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler',
  'Code is like humor. When you have to explain it, it’s bad. — Cory House',
  'Simplicity is the soul of efficiency. — Austin Freeman',
  'Make it work, make it right, make it fast. — Kent Beck',
  'The only way to go fast is to go well. — Robert C. Martin',
  'Debugging is twice as hard as writing the code in the first place. — Brian Kernighan',
  'Programs must be written for people to read, and only incidentally for machines to execute. — Harold Abelson',
  "It's not a bug — it's an undocumented feature. — Anonymous",
  'I have not failed. I’ve just found 10,000 ways that won’t work. — Thomas Edison',
  'The computer was born to solve problems that did not exist before. — Bill Gates',
  'In theory, there is no difference between theory and practice. In practice, there is. — Yogi Berra',
  'If you can’t explain it simply, you don’t understand it well enough. — Albert Einstein',
];

export class CommandFortune extends CommandBase {
  static override base = 'fortune';
  static override alts = ['quote', 'wisdom'];
  override args: NCommandBase.IArg = {
    execute: () => {
      const index = Math.floor(Math.random() * quotes.length);
      return {
        name: 'write',
        data: [
          [],
          [
            {
              type: 'text',
              value: quotes[index],
              color: 'yellow',
            },
          ],
          [],
        ],
      };
    },
  };
}
