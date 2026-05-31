import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Input } from '@ui5/webcomponents-react';
import { Configuration, PickListDto } from 'api/generated';

interface CustomInputComponentProps {
    value?: string;
}

const CustomInputComponent = forwardRef<{ current: string, setValue: (value: string) => void }, CustomInputComponentProps>(({ value }, ref) => {
    const [textValue, setTextValue] = useState<string>(value || '');

    useImperativeHandle(ref, () => ({
        current: textValue,
        setValue: (newValue: string) => setTextValue(newValue),
    }));

    const handleJobCodeNameInput = (e: any) => {
        const newValue = e.target.value;
        setTextValue(newValue);
    };

    useEffect(() => {
        if (value !== undefined) {
            setTextValue(value);
        }
    }, [value]);

    return (
        <Input onInput={handleJobCodeNameInput} value={textValue} required={true} type="Text" />
    );
});


export default CustomInputComponent;
