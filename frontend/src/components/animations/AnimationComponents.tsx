import React from 'react';
import {
  Box,
  BoxProps,
} from '@chakra-ui/react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Create motion components
const MotionBox = motion(Box);

// Animation Variants for Framer Motion
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideVariants: Variants = {
  hidden: { x: -100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
  exit: { x: 100, opacity: 0, transition: { duration: 0.2 } },
};

export const scaleVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } },
};

export const staggerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

// Animation Components

// Type to exclude conflicting props between Chakra and Framer Motion
type SafeBoxProps = Omit<BoxProps, 
  'transition' | 
  'onDrag' | 
  'onDragStart' | 
  'onDragEnd' | 
  'onAnimationStart' | 
  'onAnimationEnd' | 
  'animate' | 
  'initial' | 
  'exit' | 
  'variants' |
  'whileHover' |
  'whileTap' |
  'whileFocus' |
  'whileDrag'
>;

// Fade Animation
interface FadeAnimationProps extends SafeBoxProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export const FadeAnimation: React.FC<FadeAnimationProps> = ({
  children,
  duration = 0.3,
  delay = 0,
  ...props
}) => {
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Slide Animation
interface SlideAnimationProps extends SafeBoxProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  duration?: number;
  delay?: number;
}

export const SlideAnimation: React.FC<SlideAnimationProps> = ({
  children,
  direction = 'left',
  duration = 0.3,
  delay = 0,
  ...props
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -100, opacity: 0 };
      case 'right': return { x: 100, opacity: 0 };
      case 'top': return { y: -100, opacity: 0 };
      case 'bottom': return { y: 100, opacity: 0 };
      default: return { x: -100, opacity: 0 };
    }
  };

  return (
    <MotionBox
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={getInitialPosition()}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Scale Animation
interface ScaleAnimationProps extends SafeBoxProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export const ScaleAnimation: React.FC<ScaleAnimationProps> = ({
  children,
  duration = 0.3,
  delay = 0,
  ...props
}) => {
  return (
    <MotionBox
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Hover Effects
interface HoverEffectProps extends SafeBoxProps {
  children: React.ReactNode;
  effect?: 'lift' | 'scale' | 'glow' | 'rotate' | 'pulse';
  intensity?: 'subtle' | 'medium' | 'strong';
}

export const HoverEffect: React.FC<HoverEffectProps> = ({
  children,
  effect = 'lift',
  intensity = 'medium',
  ...props
}) => {
  const getHoverProps = () => {
    const intensityMap = {
      subtle: { scale: 1.02, y: -2 },
      medium: { scale: 1.05, y: -4 },
      strong: { scale: 1.08, y: -8 },
    };

    const config = intensityMap[intensity];

    switch (effect) {
      case 'lift':
        return {
          whileHover: { y: -config.y },
          transition: { duration: 0.2 },
        };
      case 'scale':
        return {
          whileHover: { scale: config.scale },
          transition: { duration: 0.2 },
        };
      case 'glow':
        return {
          whileHover: { filter: 'drop-shadow(0 0 20px rgba(66, 153, 225, 0.5))' },
          transition: { duration: 0.2 },
        };
      case 'rotate':
        return {
          whileHover: { rotate: 3 },
          transition: { duration: 0.2 },
        };
      case 'pulse':
        return {
          whileHover: { scale: [1, 1.05, 1] },
          transition: { duration: 1, repeat: Infinity },
        };
      default:
        return {};
    }
  };

  return (
    <MotionBox
      cursor="pointer"
      {...getHoverProps()}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Notification Animation
interface NotificationAnimationProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export const NotificationAnimation: React.FC<NotificationAnimationProps> = ({
  children,
  isVisible,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <MotionBox
          initial={{ opacity: 0, scale: 0.8, y: -100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {children}
        </MotionBox>
      )}
    </AnimatePresence>
  );
};

// Stagger Container
interface StaggerContainerProps extends SafeBoxProps {
  children: React.ReactNode;
  staggerDelay?: number;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  ...props
}) => {
  return (
    <MotionBox
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Stagger Item
interface StaggerItemProps extends SafeBoxProps {
  children: React.ReactNode;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  ...props
}) => {
  return (
    <MotionBox
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Page Transition
interface PageTransitionProps {
  children: React.ReactNode;
  key?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  key,
}) => {
  return (
    <AnimatePresence mode="wait">
      <MotionBox
        key={key}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        w="full"
        h="full"
      >
        {children}
      </MotionBox>
    </AnimatePresence>
  );
};

// Expandable component for smooth show/hide
interface ExpandableProps extends SafeBoxProps {
  children: React.ReactNode;
  isExpanded: boolean;
}

export const Expandable: React.FC<ExpandableProps> = ({
  children,
  isExpanded,
  ...props
}) => {
  return (
    <MotionBox
      initial={false}
      animate={{
        height: isExpanded ? 'auto' : 0,
        opacity: isExpanded ? 1 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      overflow="hidden"
      {...props}
    >
      {children}
    </MotionBox>
  );
};

// Export motion components for external use
export { MotionBox, AnimatePresence };