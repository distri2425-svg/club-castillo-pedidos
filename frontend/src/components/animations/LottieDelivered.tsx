// src/components/LottiePreparingFood.tsx
import React from 'react';
import Lottie from 'lottie-react';
import delivered from '../../assets/animations/entregado.json';

const LottieDelivered: React.FC = () => (
    <div style={{ width: 150, margin: '0 auto' }}>
        <Lottie
            animationData={delivered}
            loop={true}
            autoplay={true}
        />
    </div>
);

export default LottieDelivered;
