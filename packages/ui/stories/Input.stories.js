import { Input } from '../src/components/Input';
const meta = {
    title: 'Components/Input',
    component: Input,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};
export default meta;
export const Default = {
    args: {
        placeholder: 'Enter text...',
    },
};
export const WithLabel = {
    args: {
        label: 'Username',
        placeholder: 'Enter your username',
    },
};
export const WithError = {
    args: {
        label: 'Email',
        placeholder: 'Enter your email',
        error: 'Please enter a valid email address',
    },
};
export const Small = {
    args: {
        label: 'Small Input',
        placeholder: 'Small input',
        size: 'sm',
    },
};
export const Large = {
    args: {
        label: 'Large Input',
        placeholder: 'Large input',
        size: 'lg',
    },
};
export const Disabled = {
    args: {
        label: 'Disabled Input',
        placeholder: 'Disabled input',
        disabled: true,
    },
};
export const WithValue = {
    args: {
        label: 'Input with value',
        defaultValue: 'Some default text',
    },
};
//# sourceMappingURL=Input.stories.js.map