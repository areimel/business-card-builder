import { make } from '../../../../../server/components/core.jsx';
import { word } from './word.js';

const Box = make('fx-greeting');
export const Greeting = () => <Box>{word}</Box>;
