// This is a temporary file to hold the implementation of the handlePublishEvent function

// Add this function after the handleCheckIn function in AdminEventDetail.tsx
const handlePublishEvent = async () => {
  if (!id) return;
  setIsPublishing(true);
  try {
    const updatedEvent = await eventService.publishEvent(id);

    // Update the event status in the state
    setEvent(updatedEvent);

    toast({
      title: 'Success',
      description: 'Event published successfully',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  } catch (error) {
    console.error('Error publishing event:', error);

    let errorMessage = 'Failed to publish event';
    if (error?.response?.data?.message) {
      errorMessage += `: ${error.response.data.message}`;
    } else if (error?.message) {
      errorMessage += `: ${error.message}`;
    }

    toast({
      title: 'Error',
      description: errorMessage,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  } finally {
    setIsPublishing(false);
  }
};
