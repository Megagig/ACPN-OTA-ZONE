import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import eventService from '../../services/event.service';
import type { Event } from '../../types/event.types';

const EventCalendar: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [eventsForSelectedDate, setEventsForSelectedDate] = useState<Event[]>(
    []
  );

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await eventService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // When selectedDate changes, update eventsForSelectedDate
  useEffect(() => {
    if (selectedDate) {
      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);

      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);

      const filteredEvents = events.filter((event) => {
        const eventStartDate = new Date(event.startDate);
        const eventEndDate = new Date(event.endDate);

        return (
          (eventStartDate >= selectedDateStart &&
            eventStartDate <= selectedDateEnd) ||
          (eventEndDate >= selectedDateStart &&
            eventEndDate <= selectedDateEnd) ||
          (eventStartDate <= selectedDateStart &&
            eventEndDate >= selectedDateEnd)
        );
      });

      setEventsForSelectedDate(filteredEvents);
    } else {
      setEventsForSelectedDate([]);
    }
  }, [selectedDate, events]);

  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Calculate days from previous month to fill the first week
    const daysFromPrevMonth = firstDay.getDay();

    // Calculate total days in the calendar (including days from prev/next months)
    const totalDays = daysFromPrevMonth + lastDay.getDate();
    const totalWeeks = Math.ceil(totalDays / 7);

    const calendarDays: Date[] = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      calendarDays.push(new Date(year, month, i));
    }

    // Add days from next month to fill remaining slots
    const remainingDays = totalWeeks * 7 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(new Date(year, month + 1, i));
    }

    return calendarDays;
  };

  // Check if a date has events
  const hasEvents = (date: Date) => {
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    return events.some((event) => {
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);

      return (
        (eventStartDate >= dateStart && eventStartDate <= dateEnd) ||
        (eventEndDate >= dateStart && eventEndDate <= dateEnd) ||
        (eventStartDate <= dateStart && eventEndDate >= dateEnd)
      );
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Navigate to current month
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get event type badge class
  const getEventTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'conference':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'workshop':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'seminar':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'training':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case 'meeting':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'social':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300';
      case 'other':
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Event Calendar</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            onClick={() => navigate('/events/create')}
          >
            <i className="fas fa-plus mr-2"></i>
            Create Event
          </button>
          <button
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-md text-sm shadow focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-offset-background"
            onClick={() => navigate('/events')}
          >
            <i className="fas fa-list mr-2"></i>
            List View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
            {/* Calendar navigation */}
            <div className="bg-primary text-primary-foreground px-4 py-3 flex justify-between items-center">
              <button
                className="text-primary-foreground hover:bg-primary/80 rounded p-1 focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={goToPreviousMonth}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <h2 className="text-lg font-semibold">
                {currentMonth.toLocaleDateString('en-NG', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="flex space-x-2">
                <button
                  className="text-primary-foreground hover:bg-primary/80 rounded p-1 focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={goToCurrentMonth}
                  title="Today"
                >
                  <i className="fas fa-calendar-day"></i>
                </button>
                <button
                  className="text-primary-foreground hover:bg-primary/80 rounded p-1 focus:outline-none focus:ring-2 focus:ring-ring"
                  onClick={goToNextMonth}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="p-2">
              {/* Weekdays header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar days */}
              {isLoading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-7 gap-1">
                    {[...Array(35)].map((_, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-muted rounded"
                      ></div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((date, index) => {
                    const isCurrentMonth =
                      date.getMonth() === currentMonth.getMonth();
                    const isToday =
                      date.toDateString() === new Date().toDateString();
                    const isSelected =
                      selectedDate &&
                      date.toDateString() === selectedDate.toDateString();
                    const dateHasEvents = hasEvents(date);

                    return (
                      <div
                        key={index}
                        className={`
                          relative aspect-square p-1 rounded cursor-pointer
                          ${
                            isCurrentMonth
                              ? 'bg-card text-foreground'
                              : 'bg-muted text-muted-foreground'
                          }
                          ${isToday ? 'border border-primary' : ''}
                          ${isSelected ? 'bg-accent' : ''}
                          hover:bg-muted/50
                        `}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="h-full flex flex-col">
                          <div
                            className={`
                            text-right text-sm
                            ${isToday ? 'text-primary font-bold' : ''}
                          `}
                          >
                            {date.getDate()}
                          </div>

                          {dateHasEvents && (
                            <div className="mt-1 flex justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Events for selected date */}
        <div className="md:col-span-1">
          <div className="bg-card rounded-lg shadow-md border border-border h-full p-4">
            <h3 className="font-medium text-foreground mb-4">
              {selectedDate ? (
                <>Events for {formatDate(selectedDate)}</>
              ) : (
                <>Select a date to view events</>
              )}
            </h3>

            {selectedDate && eventsForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-calendar text-muted-foreground/50 text-3xl mb-2"></i>
                <p>No events scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventsForSelectedDate.map((event) => (
                  <div
                    key={event._id}
                    className="border border-border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/events/${event._id}`)}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                        <i className="fas fa-calendar-alt"></i>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {event.title}
                        </h4>
                        <span
                          className={`text-xs ${getEventTypeBadgeClass(
                            event.eventType
                          )} px-2 py-0.5 rounded-full`}
                        >
                          {event.eventType?.charAt(0).toUpperCase() +
                            event.eventType?.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center mb-1">
                        <i className="fas fa-clock w-4 text-center mr-2"></i>
                        <span>
                          {formatTime(event.startDate)} -{' '}
                          {formatTime(event.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-map-marker-alt w-4 text-center mr-2"></i>
                        <span>
                          {event.location.virtual
                            ? 'Virtual Event'
                            : event.location.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
