// src/components/LottiePreparingFood.tsx
import React from 'react';
import Lottie from 'lottie-react';
import preparingFood from '../../assets/animations/preparando.json';

const LottiePreparingFood: React.FC = () => (
    <div style={{ width: 300, margin: '0 auto' }}>
        <Lottie
            animationData={preparingFood}
            loop={true}
            autoplay={true}
        />
    </div>
);

export default LottiePreparingFood;
