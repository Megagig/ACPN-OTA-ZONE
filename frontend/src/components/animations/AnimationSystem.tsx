import React from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { Box, BoxProps } from '@chakra-ui/react';

// Motion Box Component
export const MotionBox = motion(Box);

// Animation Variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const slideLeft: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const scale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const bounce: Variants = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      damping: 10,
      stiffness: 100,
    }
  },
  exit: { opacity: 0, scale: 0.3 },
};

export const stagger: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Hover and Tap Effects
export const hoverScale = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

export const hoverLift = {
  whileHover: { y: -4, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' },
  whileTap: { y: 0 },
};

export const hoverGlow = {
  whileHover: { 
    boxShadow: '0 0 20px rgba(66, 153, 225, 0.3)',
    transition: { duration: 0.3 }
  },
};

// Page Transition Variants
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    }
  },
};

export const modalTransition: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    y: 20,
    transition: {
      duration: 0.2,
    }
  },
};

export const drawerTransition: Variants = {
  initial: { x: '-100%' },
  animate: { 
    x: 0,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
    }
  },
  exit: { 
    x: '-100%',
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    }
  },
};

// Loading Animation Variants
export const pulseLoader: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spinLoader: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

export const dotsLoader: Variants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Notification Animation Variants
export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 300, scale: 0.3 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    }
  },
  exit: { 
    opacity: 0, 
    x: 300, 
    scale: 0.5,
    transition: {
      duration: 0.2,
    }
  },
};

export const alertBounce: Variants = {
  initial: { opacity: 0, scale: 0.8, y: -50 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 300,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8, 
    y: -50,
    transition: {
      duration: 0.2,
    }
  },
};

// Card Animation Variants
export const cardHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -8,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    }
  },
  tap: { scale: 0.98 },
};

export const cardFlip: Variants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 },
};

// List Animation Variants
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    }
  },
};

// Reusable Animated Components
interface AnimatedBoxProps extends BoxProps {
  variant?: keyof typeof animationVariants;
  children: React.ReactNode;
}

const animationVariants = {
  fadeIn,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scale,
  bounce,
};

export const AnimatedBox: React.FC<AnimatedBoxProps> = ({
  variant = 'fadeIn',
  children,
  ...boxProps
}) => {
  // Remove any conflicting props that might cause type issues
  const { transition, animate, initial, exit, variants, ...safeProps } = boxProps as any;
  
  return (
    <MotionBox
      variants={animationVariants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      {...safeProps}
    >
      {children}
    </MotionBox>
  );
};

// Page Wrapper with Animation
interface AnimatedPageProps {
  children: React.ReactNode;
  variant?: 'slide' | 'fade' | 'scale';
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  variant = 'slide',
}) => {
  const variants = {
    slide: pageTransition,
    fade: fadeIn,
    scale: scale,
  };

  return (
    <MotionBox
      variants={variants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </MotionBox>
  );
};

// Staggered List Animation
interface StaggeredListProps {
  children: React.ReactNode[];
  delay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  delay = 0.1,
}) => {
  return (
    <MotionBox
      variants={{
        animate: {
          transition: {
            staggerChildren: delay,
          },
        },
      }}
      initial="initial"
      animate="animate"
    >
      {React.Children.map(children, (child, index) => (
        <MotionBox
          key={index}
          variants={staggerItem}
        >
          {child}
        </MotionBox>
      ))}
    </MotionBox>
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  variant?: 'spin' | 'pulse' | 'dots';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color = '#3182CE',
  variant = 'spin',
}) => {
  const variants = {
    spin: spinLoader,
    pulse: pulseLoader,
    dots: dotsLoader,
  };

  if (variant === 'dots') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
        {[0, 1, 2].map((i) => (
          <MotionBox
            key={i}
            variants={dotsLoader}
            animate="animate"
            transition={{ delay: i * 0.2 }}
            w={3}
            h={3}
            borderRadius="full"
            bg={color}
          />
        ))}
      </Box>
    );
  }

  return (
    <MotionBox
      variants={variants[variant]}
      animate="animate"
      w={`${size}px`}
      h={`${size}px`}
      border="3px solid"
      borderColor="gray.200"
      borderTopColor={color}
      borderRadius="full"
    />
  );
};

// Floating Action Button
interface FloatingButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  children,
  position = 'bottom-right',
  ...props
}) => {
  const positions = {
    'bottom-right': { bottom: 4, right: 4 },
    'bottom-left': { bottom: 4, left: 4 },
    'top-right': { top: 4, right: 4 },
    'top-left': { top: 4, left: 4 },
  };

  return (
    <motion.button
      style={{
        position: 'fixed',
        zIndex: 1000,
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        border: 'none',
        background: '#3182CE',
        color: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        ...positions[position],
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 300,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Micro-interactions
export const microInteractions = {
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', damping: 20, stiffness: 300 },
  },
  
  card: {
    whileHover: { y: -4, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' },
    transition: { duration: 0.2 },
  },
  
  input: {
    whileFocus: { scale: 1.02 },
    transition: { duration: 0.2 },
  },
  
  icon: {
    whileHover: { rotate: 5, scale: 1.1 },
    whileTap: { rotate: -5, scale: 0.9 },
    transition: { type: 'spring', damping: 15, stiffness: 300 },
  },
  
  badge: {
    whileHover: { scale: 1.05 },
    transition: { type: 'spring', damping: 20, stiffness: 400 },
  },
};
