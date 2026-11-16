// src/components/LottiePreparingFood.tsx
import React from 'react';
import Lottie from 'lottie-react';
import ready from '../../assets/animations/retirar.json';

const LottieReady: React.FC = () => (
    <div style={{ width: 300, margin: '0 auto' }}>
        <Lottie
            animationData={ready}
            loop={true}
            autoplay={true}
        />
    </div>
);

export default LottieReady;
