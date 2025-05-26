export interface Event {
  id: number;
  organizerId: number;
  name: string;
  description: string;
  image: string;
  lat: number;
  lng: number;
  start: string;
  end: string;
}

export interface EventWithAttendance extends Event {
  attending: boolean;
}

export interface EventWithDistance extends Event {
  distance: number;
}

export interface PaginatedEvents {
  events: Event[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedEventsWithAttendance extends PaginatedEvents {
  events: EventWithAttendance[];
}
