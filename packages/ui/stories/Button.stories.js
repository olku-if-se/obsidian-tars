import { Button } from '../src/components/Button';
const meta = {
    title: 'Components/Button',
    component: Button,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};
export default meta;
export const Default = {
    args: {
        children: 'Click me',
    },
};
export const Primary = {
    args: {
        children: 'Primary Button',
        variant: 'primary',
    },
};
export const Danger = {
    args: {
        children: 'Danger Button',
        variant: 'danger',
    },
};
export const Small = {
    args: {
        children: 'Small Button',
        size: 'sm',
    },
};
export const Large = {
    args: {
        children: 'Large Button',
        size: 'lg',
    },
};
export const Disabled = {
    args: {
        children: 'Disabled Button',
        disabled: true,
    },
};
export const WithIcon = {
    args: {
        children: '⚡ Button',
        variant: 'primary',
    },
};
//# sourceMappingURL=Button.stories.js.map