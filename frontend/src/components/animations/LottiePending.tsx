// src/components/LottiePreparingFood.tsx
import React from 'react';
import Lottie from 'lottie-react';
import pending from '../../assets/animations/pendiente.json';

const LottiePending: React.FC = () => (
    <div style={{ width: 100, margin: '0 auto' }}>
        <Lottie
            animationData={pending}
            loop={true}
            autoplay={true}
        />
    </div>
);

export default LottiePending;
