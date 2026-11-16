// src/components/LottiePreparingFood.tsx
import React from 'react';
import Lottie from 'lottie-react';
import confirmed from '../../assets/animations/confirmado.json';

const LottieConfirmed: React.FC = () => (
    <div style={{ width: 100, margin: '0 auto' }}>
        <Lottie
            animationData={confirmed}
            loop={true}
            autoplay={true}
        />
    </div>
);

export default LottieConfirmed;
