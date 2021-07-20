#!/usr/bin/env python3

import csv
from datetime import datetime, timedelta
import holoviews as hv
from holoviews import dim, opts
import logging
import matplotlib.backends.backend_pdf
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np
import pandas as pd
import os
import sys
import time


def usage():
    print(
        """{0}: make graphs of zoom meetings from UserQos... CSVs.

Must add a new first column to the header row of each CSV: Room Name.
Export CSV of each meeting from the dashboard and add the new	at the left of the header.

Usage: {0} csv1.csv [csv2.csv csv3.csv...]
""".format(sys.argv[0]))


if len(sys.argv) <= 1:
    usage()
    sys.exit()

# Holoviews init
hv.extension('matplotlib')

# REVISIT: move to args
# Uncomment for info logging
logging.basicConfig(level=logging.INFO)
# Uncomment for debug logging
# logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger(__name__)


class TimeRange(object):
    def __init__(self, start, end):
        self.start = start
        self.end = end
        self.duration = self.end - self.start

    def is_overlapped(self, time_range):
        return max(self.start, time_range.start) < min(self.end, time_range.end)

    def total_minutes(self):
        return (self.end - self.start).total_seconds() / 60

    def __repr__(self):
        return '{} -> {}'.format(self.start, self.end)


class Config():
    # REVISIT: move to command-line args
    # Party start/duration/end
    # (YYYY, MM, DD, HH)
    START = datetime(2020, 10, 7, 12, 0, 0, 0)
    END = START + timedelta(hours=12)
    SEGMENTS = {
        'Whole time': TimeRange(START, START + timedelta(hours=12)),
        'Main Party': TimeRange(START + timedelta(hours=6), START + timedelta(hours=9)),
    }
    MEETING_ID_RENAMES = {
        '81259280306': 'Shrinking Station',
        '82383634053': 'Tip of the Tongue',
        '89072177227': 'Heart of the Party',
        '85105150305': 'All Ears',
        '84119671594': 'Court-X',
        '85485729711': 'Third Eye',
        '85030810493': 'The Voice Box',
        '83776728154': 'InDigest-Inn',
        '88193100121': 'Womb For Improvement',
        '87127042202': 'Funk in the Trunk',
        '86578482268': 'The Clitoris',
        '86901109362': 'Try Your Hand',
        '81896872245': 'The Bladder',
        '89718158675': 'Funny Bones'
    }
    ROOM_RENAMES = {
        'Welcome to the Tree of Life 1': 'Rabbit Hole - Entrance Experience',
        'Welcome to the Tree of Life 2': 'The Roots',
        'Welcome to the Tree of Life 3': 'Upside Down Room - The Bat Cave',
        'Welcome to the Tree of Life 4': 'Funk in the Trunk',
        'Welcome to the Tree of Life 5': 'Heart Room',
        'Welcome to the Tree of Life 6': 'The Mood Swing',
        'Welcome to the Tree of Life 7': 'The Treehouse',
        'Welcome to the Tree of Life 8': 'The Beehive',
        'Welcome to the Tree of Life 9': 'The Canopy',
        'Welcome to the Tree of Life 10': 'The Compost Heap (Toilets Here)',
        'Welcome to the Tree of Life 11': 'Sunset Room',
        'Welcome to the Tree of Life 12': 'Lost Soul Chamber',
        'Late May Party 1': 'The Dock of the Bay',
        'Late May Party 2': 'Friend Ship',
        'Late May Party 3': 'Funk on a Junk',
        'Late May Party 4': 'Tropicana Fanta Sea',
        'Late May Party 5': 'Heart of the Sea',
        'Late May Party 6': 'Yellow Submarine',
        'Late May Party 7': 'Boaty McBoatface',
        'Late May Party 8': 'The Lifeboat',
        'Late May Party 9': 'Sirens\' Call',
        'Late May Party 10': 'Lighthouse',
        'Late May Party 11': 'Castaway Raft',
        'Late May Party 12': 'The Ark',
        'Late May Party 13': 'Great Barrier Grief',
        'Island Festival Mid-June 1': 'The Bermuda Party Portal',
        'Island Festival Mid-June 2': 'W*A*R*S Subsurface Disco',
        'Island Festival Mid-June 3': 'Klub Krabi',
        'Island Festival Mid-June 4': 'Tropicana Fantasea Island Resort',
        'Island Festival Mid-June 5': 'The Love Lagoon',
        'Island Festival Mid-June 6': 'Survivor Island',
        'Island Festival Mid-June 8': 'XNN Research Bunker',
        'Island Festival Mid-June 9': 'Sirens\' Call / Castaway Clowns',
        'Island Festival Mid-June 10': 'The Worldpool',
        'Island Festival Mid-June 11': 'Mystic EyeLand',
        'Island Festival Mid-June 12': 'Deserted Island',
        'Island Festival Mid-June 13': 'Great Barrier Grief',
        'Journey to the Center of the Earth 1': 'Vulcanic Lift Shaft',
        'Journey to the Center of the Earth 3': 'The Stalag Might?',
        'Journey to the Center of the Earth 4': 'TECHNO-TONICS / Richter RPM / Centre of Groovity',
        'Journey to the Center of the Earth 5': 'Core-Reality',
        'Journey to the Center of the Earth 6': 'The Mantle Peace',
        'Journey to the Center of the Earth 7': 'Fantasea Lava Spa',
        'Journey to the Center of the Earth 8': 'Magnetic Feels Cabaret',
        'Journey to the Center of the Earth 9': 'Wishing Well',
        'Journey to the Center of the Earth 10': 'The Last Campfire',
        'Journey to the Center of the Earth 11': 'The Landfill / Sedi Mental / Meta More Peak',
        'Journey to the Center of the Earth 12': 'The International Grace Station',
        'Time Warp Party 1': 'Temporal-Mental Time Machine',
        'Time Warp Party 2': 'The Infinite Theatre',
        'Time Warp Party 3': 'Time Heals',
        'Time Warp Party 4': 'World of Woodstock',
        'Time Warp Party 5': 'Remember the Times',
        'Time Warp Party 6': 'Utopiyeah',
        'Time Warp Party 7': 'Antimatter Evacuation Chute',
        'Time Warp Party 8': 'The Present',
        'Time Warp Party 9': 'DDP Disco Doge',
        'Time Warp Party 10': 'The Centuripede',
        'Time Warp Party 11': 'Pre-Pocalyptic Pussy Cat Pirates',
        'Time Warp Party 12': 'Entrance Experience Part 2',
        'End of the Universe 1': 'Apocalyse Meow Cabaret',
        'End of the Universe 2': 'Worm Whole',
        'End of the Universe 3': 'Wish Upon A Star',
        'End of the Universe 4': 'XNN Colony Fantasea Rocket',
        'End of the Universe 5': 'Stardust',
        'End of the Universe 6': 'Space Loo',
        'End of the Universe 7': 'Goddess Galaxy',
        'End of the Universe 8': 'Shake Your Assteroid',
        'End of the Universe 10': 'The Oat Milky Way',
        'End of the Universe 11': 'Powered By SparkleVerse',
        'End of the Universe 12': 'Escape Pod',
    }
    ROOM_TIMEZONE_OFFSETS = {
        'Moon Rock Room- Live performers and deep space hitchhikers': timedelta(hours=-1),
        'Midnight Reception': timedelta(hours=-1)
    }


class ZoomReportParser():
    def __init__(self, filenames):
        self._all_visits = []
        self._visits_by_user = {}
        self._all_joins = []
        self._all_leaves = []
        self._rooms = []
        self._room_joins = {}
        self._room_leaves = {}
        self._all_visit_durations = []
        self._visit_durations = {}
        self.parse(filenames)

        # Generate x for every second in the data
        self.x = [Config.START + timedelta(seconds=x)
                  for x in range(0, (Config.END - Config.START).seconds)]

    def parse(self, filenames):
        for f in filenames:
            with open(f) as csvfile:
                filename = os.path.basename(csvfile.name)
                log.info("Opening file {}".format(filename))
                if filename.startswith('UserQos_'):
                    self.process_admin_report(csvfile)
                elif filename.startswith('participants_'):
                    self.process_user_report(csvfile)
                else:
                    raise Error(
                        'unknown csv format based on filename: {} for {}'.format(filename, f))

        self.sort_data()
        log.info("Parsing completed. Total visits: {}, Total users: {}".format(
            len(self._all_visits), len(self._visits_by_user.keys())))
        self.log_debug_stats()
        self.write_visits()

    def sort_data(self):
        self._all_joins.sort()
        self._all_leaves.sort()
        for room in self._rooms:
            self._room_joins[room].sort()
            self._room_leaves[room].sort()
        for user in self._visits_by_user:
            self._visits_by_user[user].sort(
                key=lambda user_visit: user_visit['visit'].start)

    def write_visits(self):
        with open("visits.txt", "w") as visits_file:
            for user in self._visits_by_user.keys():
                visits_file.write("{}: {}\n".format(user, ",".join(
                    [user_visit['room'] for user_visit in self._visits_by_user[user]])))

    @staticmethod
    def real_room_name(room, meeting_id):
        if meeting_id in Config.MEETING_ID_RENAMES:
            return Config.MEETING_ID_RENAMES[meeting_id]
        if room in Config.ROOM_RENAMES:
            return Config.ROOM_RENAMES[room]
        return room

    def record_visit(self, user, room, meeting_id, join_time, leave_time):
        room = self.real_room_name(room, meeting_id)
        log.debug("record_visit: Room {}; User: {}; Entered: {}; Left: {}".format(
            room, user, join_time, leave_time))

        if room in Config.ROOM_TIMEZONE_OFFSETS:
            log.debug("Room {} has an offset of {}; correcting join and leave times".format(
                room, Config.ROOM_TIMEZONE_OFFSETS[room]))
            join_time = join_time + Config.ROOM_TIMEZONE_OFFSETS[room]
            leave_time = leave_time + Config.ROOM_TIMEZONE_OFFSETS[room]

        if leave_time < join_time:
            log.debug("Error: leave time is before join time")
            exit(1)

        if leave_time < Config.START:
            log.debug("### Discarding visit, it ends before the party started")
            return

        if join_time > Config.END:
            log.debug("### Discarding visit, it starts after the party ended")
            return

        if join_time < Config.START:
            log.debug(
                "@@@ Bumping visit start time {} to party start {}".format(join_time, Config.START))
            join_time = Config.START

        if leave_time > Config.END:
            log.debug(
                "@@@ Bumping visit end time {} to party end {}".format(leave_time, Config.END))
            leave_time = Config.END

        visit = TimeRange(join_time, leave_time)
        self._all_visits.append({'room': room, 'user': user, 'visit': visit})

        if user not in self._visits_by_user:
            self._visits_by_user[user] = []
        self._visits_by_user[user].append({'room': room, 'visit': visit})

        self._all_joins.append(join_time)
        self._all_leaves.append(leave_time)

        if room not in self._rooms:
            self._rooms.append(room)

        if room not in self._room_joins:
            self._room_joins[room] = []
        self._room_joins[room].append(join_time)

        if room not in self._room_leaves:
            self._room_leaves[room] = []
        self._room_leaves[room].append(leave_time)

        self._all_visit_durations.append(visit.total_minutes())
        for segment in Config.SEGMENTS:
            for room in self._rooms:
                if visit.is_overlapped(Config.SEGMENTS[segment]):
                    if segment not in self._visit_durations:
                        self._visit_durations[segment] = {}
                    if room not in self._visit_durations[segment]:
                        self._visit_durations[segment][room] = []
                    self._visit_durations[segment][room].append(
                        visit.total_minutes())

    def process_admin_report(self, csvfile):
        log.debug("process_admin_report: Processing {}...".format(csvfile.name))
        # Ignore header row
        csvfile.readline()
        header_values = csvfile.readline().split(',')
        room = header_values[0]
        log.debug("Got room name: {}".format(room))
        meeting_id = header_values[1]
        log.debug("Got meeting ID: {}".format(meeting_id))
        meeting_start_time_str = header_values[8] + header_values[9]
        meeting_start_date = datetime.strptime(
            meeting_start_time_str, '"%b %d %Y %I:%M %p"').date()
        meeting_start_datetime = datetime(
            year=meeting_start_date.year, month=meeting_start_date.month, day=meeting_start_date.day)
        log.debug("Got meeting start day: {} (raw: {})".format(
            meeting_start_datetime, meeting_start_time_str))

        # Slurp a character from the CSV, to make DictReader behave.
        # Perhaps an intern built Zoom's CSV export,
        csvfile.read(1)

        r = csv.DictReader(csvfile)
        for row in r:
            participant = row['Participant']
            location = row['Location'].replace(' )', ')')
            user = "{} from {}".format(participant, location)
            join_time_str = row.get('Join Time')
            leave_time_str = row.get('Leave Time').split('(')[0]

            join_time_parsed = datetime.strptime(join_time_str, '%I:%M %p')
            join_time = meeting_start_datetime + \
                timedelta(hours=join_time_parsed.hour,
                          minutes=join_time_parsed.minute, seconds=join_time_parsed.second)

            leave_time_parsed = datetime.strptime(leave_time_str, '%I:%M %p')
            leave_time = meeting_start_datetime + \
                timedelta(hours=leave_time_parsed.hour,
                          minutes=leave_time_parsed.minute, seconds=leave_time_parsed.second)

            self.record_visit(user, room, meeting_id, join_time, leave_time)

    def process_user_report(self, csvfile):
        log.debug("process_user_report: Processing {}...".format(csvfile.name))
        # Ignore header row
        csvfile.readline()
        header_values = csvfile.readline().split(',')
        meeting_id = header_values[0]
        log.debug("Got meeting ID: {}".format(meeting_id))
        room = header_values[1]
        log.debug("Got room topic: {}".format(room))

        # Slurp a character from the CSV, to make DictReader behave.
        # Perhaps an intern built Zoom's CSV export,
        csvfile.read(1)

        r = csv.DictReader(csvfile)
        for row in r:
            user = row['Name (Original Name)']
            email = row['User Email']
            if len(email) > 0:
                user = email

            join_time_str = row.get('Join Time')
            leave_time_str = row.get('Leave Time')

            join_time = datetime.strptime(
                join_time_str, '%m/%d/%Y %I:%M:%S %p')
            leave_time = datetime.strptime(
                leave_time_str, '%m/%d/%Y %I:%M:%S %p')

            self.record_visit(user, room, meeting_id, join_time, leave_time)

    def log_debug_stats(self):
        overlapping_visits = []
        for user in self._visits_by_user.keys():
            for visit1 in self._visits_by_user[user]:
                for visit2 in self._visits_by_user[user]:
                    if visit1 != visit2 and visit1['visit'].is_overlapped(visit2['visit']):
                        overlapping_visits.append(
                            {'user': user, 'visit': visit1})
        log.debug("Total overlapping visits: {}".format(
            len(overlapping_visits)))

        log.debug("Total joins: {}".format(len(self._all_joins)))
        log.debug("Total leaves: {}".format(len(self._all_leaves)))
        log.debug("Rooms joined: {}".format(self._room_joins.keys()))
        log.debug("Rooms left: {}".format(self._room_joins.keys()))
        for room in self._rooms:
            log.debug("Room {0}: {1} joins, {2} leaves".format(
                room, len(self._room_joins[room]), len(self._room_leaves[room])))
        log.debug("Average duration per room per segment:")
        for segment in Config.SEGMENTS:
            log.debug("Segment: {0}".format(segment))
            if segment in self._visit_durations:
                for room in self._rooms:
                    if room in self._visit_durations[segment]:
                        log.debug("Room: {0}, Average: {1}".format(room, sum(
                            self._visit_durations[segment][room])/len(self._visit_durations[segment][room])))

        log.debug("Average visit duration: {0}".format(
            sum(self._all_visit_durations)/len(self._all_visit_durations)))

        first_visit_rooms = {}
        last_visit_rooms = {}
        for user in self._visits_by_user:
            first_room = self._visits_by_user[user][0]['room']
            if first_room not in first_visit_rooms:
                first_visit_rooms[first_room] = []
            first_visit_rooms[first_room].append(user)

            last_room = self._visits_by_user[user][len(
                self._visits_by_user[user])-1]['room']
            if last_room not in last_visit_rooms:
                last_visit_rooms[last_room] = []
            last_visit_rooms[last_room].append(user)

        for room in first_visit_rooms:
            log.debug("Users whose first visit was to {0} ({1}): {2}".format(
                room, len(first_visit_rooms[room]), ','.join(first_visit_rooms[room])))
        for room in last_visit_rooms:
            log.debug("Users whose last visit was to {0} ({1}): {2}".format(
                room, len(last_visit_rooms[room]), ','.join(last_visit_rooms[room])))

    def rooms(self):
        return self._rooms

    def visit_durations(self):
        return self._all_visit_durations, self._visit_durations

    def stay_durations(self):
        stay_durations = []
        for user in self._visits_by_user:
            visits = self._visits_by_user[user]
            if len(visits) == 1:
                stay_durations.append(visits[0]['visit'].total_minutes())
            if len(visits) > 2:
                user_stay_duration = TimeRange(
                    visits[0]['visit'].start, visits[len(visits)-1]['visit'].end).total_minutes()
                stay_durations.append(user_stay_duration)
        return stay_durations

    def rooms_visited(self):
        room_counts = []
        for user in self._visits_by_user:
            visits = self._visits_by_user[user]
            if len(visits) > 0:
                rooms = {}
                for visit in visits:
                    rooms[visit['room']] = True
                room_counts.append(len(rooms))
        return room_counts

    def moves(self):
        ENTERED = '(entered)'
        EXITED = '(exited)'
        moves = {}
        moves[ENTERED] = {}

        enters_by_room = {}
        exits_by_room = {}

        for user in self._visits_by_user:
            for i in range(len(self._visits_by_user[user])+1):
                if i == 0:
                    from_room = ENTERED
                else:
                    prev_visit = self._visits_by_user[user][i-1]
                    from_room = prev_visit['room']

                if i < len(self._visits_by_user[user]):
                    to_room = self._visits_by_user[user][i]['room']

                    # Eliminate "moves to the same room" from the data
                    while from_room == to_room:
                        i += 1
                        if i < len(self._visits_by_user[user]):
                            to_room = self._visits_by_user[user][i]['room']
                        else:
                            to_room = EXITED
                else:
                    to_room = EXITED

                if from_room == ENTERED:
                    visit = self._visits_by_user[user][i]
                    room = visit['room']
                    if room not in enters_by_room:
                        enters_by_room[room] = []
                    enters_by_room[room].append(visit['visit'].start)

                if to_room == EXITED:
                    visit = self._visits_by_user[user][i-1]
                    room = visit['room']
                    if room not in exits_by_room:
                        exits_by_room[room] = []
                    exits_by_room[room].append(visit['visit'].end)

                if from_room not in moves:
                    moves[from_room] = {}
                if to_room not in moves[from_room]:
                    moves[from_room][to_room] = 0

                moves[from_room][to_room] = moves[from_room][to_room] + 1

        moves_list = []
        for from_room in moves.keys():
            for to_room in moves[from_room].keys():
                moves_list.append(
                    (from_room + ' ', to_room, moves[from_room][to_room]))

        enters = []
        exits = []
        for room in self._rooms:
            if not room in enters_by_room:
                enters_by_room[room] = []
            enters_by_room[room].sort()
            if not room in exits_by_room:
                exits_by_room[room] = []
            exits_by_room[room].sort()
            room_enters = []
            room_exits = []
            enter_count = 0
            exit_count = 0
            for i in self.x:
                if enter_count < len(enters_by_room[room]) and i >= enters_by_room[room][enter_count]:
                    enter_count += 1
                if exit_count < len(exits_by_room[room]) and i >= exits_by_room[room][exit_count]:
                    exit_count += 1
                room_enters.append(enter_count)
                room_exits.append(exit_count)
            enters.append(room_enters)
            exits.append(room_exits)

        return moves_list, enters, exits

    def attendances(self):
        y_rooms = []
        for room in self._rooms:
            y = []
            tally = 0
            join_index = 0
            leave_index = 0
            total_joins = 0
            total_leaves = 0
            log.debug("Room {0}: first join: {1}, last join: {2}, first leave: {3}, last leave: {4}".format(room, self._room_joins[room][0], self._room_joins[room][len(
                self._room_joins[room])-1], self._room_leaves[room][0], self._room_leaves[room][len(self._room_leaves[room])-1]))
            for i in self.x:
                if join_index < len(self._room_joins[room]) and i >= self._room_joins[room][join_index]:
                    tally += 1
                    join_index += 1
                    total_joins += 1
                if leave_index < len(self._room_leaves[room]) and i >= self._room_leaves[room][leave_index]:
                    tally -= 1
                    leave_index += 1
                    total_leaves += 1
                y.append(tally)
            log.debug("Recorded {0} joins and {1} leaves for room {2}".format(
                total_joins, total_leaves, room))
            y_rooms.append(y)

        y_all = []
        tally = 0
        join_index = 0
        leave_index = 0
        total_joins = 0
        total_leaves = 0
        log.debug("All joins/leaves: first join: {0}, last join: {1}, first leave: {2}, last leave: {3}".format(
            self._all_joins[0], self._all_joins[len(self._all_joins)-1], self._all_leaves[0], self._all_leaves[len(self._all_leaves)-1]))
        for i in self.x:
            if join_index < len(self._all_joins) and i >= self._all_joins[join_index]:
                tally += 1
                join_index += 1
                total_joins += 1
            if leave_index < len(self._all_leaves) and i >= self._all_leaves[leave_index]:
                tally -= 1
                leave_index += 1
                total_leaves += 1
            y_all.append(tally)
        log.debug("Recorded {0} joins and {1} leaves for all rooms".format(
            total_joins, total_leaves))

        return self.x, y_rooms, y_all


class PdfGenerator():
    hours = mdates.HourLocator()
    ten_minutes = mdates.MinuteLocator(byminute=range(0, 60, 10))
    hours_fmt = mdates.DateFormatter('%H:00')

    def __init__(self, filename):
        self.filename = filename

    def start(self):
        log.info("Creating {}...".format(self.filename))
        self.pdf = matplotlib.backends.backend_pdf.PdfPages(self.filename)
        return self

    def attendances(self, x, y_rooms, y_all, rooms):
        log.info("Generating attendances...")

        fig, ax = plt.subplots()
        ax.stackplot(x, y_rooms, labels=rooms)
        ax.legend(loc='upper left', prop={'size': 4})
        ax.xaxis.set_major_locator(PdfGenerator.hours)
        ax.xaxis.set_major_formatter(PdfGenerator.hours_fmt)
        ax.xaxis.set_minor_locator(PdfGenerator.ten_minutes)
        ax.set_xlabel('Time (PT)')
        ax.set_ylabel('Attendance (Stacked)')
        ax.grid(True)
        fig.autofmt_xdate()
        self.pdf.savefig(fig)

        fig, ax = plt.subplots()
        ax.plot(x, y_all)
        ax.xaxis.set_major_locator(PdfGenerator.hours)
        ax.xaxis.set_major_formatter(PdfGenerator.hours_fmt)
        ax.xaxis.set_minor_locator(PdfGenerator.ten_minutes)
        ax.set_xlabel('Time (PT)')
        ax.set_ylabel('Attendance (All)')
        ax.grid(True)
        fig.autofmt_xdate()
        self.pdf.savefig(fig)

        for i in range(len(rooms)):
            fig, ax = plt.subplots()
            ax.plot(x, y_rooms[i])
            ax.xaxis.set_major_locator(PdfGenerator.hours)
            ax.xaxis.set_major_formatter(PdfGenerator.hours_fmt)
            ax.xaxis.set_minor_locator(PdfGenerator.ten_minutes)
            ax.set_xlabel('Time (PT)')
            ax.set_ylabel("Attendance ({0})".format(rooms[i]))
            ax.grid(True)
            fig.autofmt_xdate()
            self.pdf.savefig(fig)
        return self

    def stay_durations(self, user_stay_durations):
        log.info("Generating stay durations...")
        longest_stay = int(max(user_stay_durations))
        fig, ax = plt.subplots()
        ax.hist(user_stay_durations, bins=int(longest_stay/5)+1)
        ax.set_xlabel("Duration (minutes)")
        plt.xlim(left=0)
        ax.set_ylabel("Quantity")
        plt.title("Stay Durations (First to Last Sighting)")
        self.pdf.savefig(fig)
        return self

    def rooms_visited(self, rooms_visited, rooms):
        log.info("Generating rooms visited...")
        number_of_rooms = len(rooms)
        fig, ax = plt.subplots()
        ax.hist(rooms_visited, bins=number_of_rooms)
        ax.set_xlabel("Rooms Visited During Stay")
        plt.xlim(left=1)
        ax.set_ylabel("Quantity of Users")
        plt.title("How Many Rooms Users Visited")
        self.pdf.savefig(fig)
        return self

    def visit_durations(self, all_visit_durations, visit_durations, rooms):
        log.info("Generating visit durations...")
        longest_visit = int(max(all_visit_durations))

        for segment in Config.SEGMENTS:
            fig, ax = plt.subplots()
            for room in rooms:
                if segment in visit_durations and room in visit_durations[segment]:
                    ax.hist(
                        visit_durations[segment][room], label=room, histtype='step', bins=longest_visit)
            ax.legend(loc='upper right', prop={'size': 4})
            ax.set_xlabel("Duration (minutes)")
            plt.xlim(left=0, right=120)
            ax.set_ylabel("Quantity")
            plt.title("Visit Durations ({0})".format(segment))
            self.pdf.savefig(fig)

        for room in rooms:
            fig, ax = plt.subplots()
            for segment in Config.SEGMENTS:
                if segment in visit_durations and room in visit_durations[segment]:
                    ax.hist(
                        visit_durations[segment][room], label=segment, histtype='step', bins=longest_visit)
            ax.legend(loc='upper right', prop={'size': 4})
            ax.set_xlabel("Duration (minutes)")
            plt.xlim(left=0, right=120)
            ax.set_ylabel("Quantity")
            plt.title("Visit Durations ({0})".format(room))
            self.pdf.savefig(fig)
        return self

    def moves(self, moves_list):
        log.info("Generating moves...")
        df = pd.DataFrame(moves_list, columns=['from', 'to', 'value'])
        fig = hv.render(hv.Sankey(moves_list, ['from', 'to'], vdims='value').opts(
            cmap='Dark2', edge_color='to', node_color='index'))
        self.pdf.savefig(fig)
        return self

    def enters(self, x, ys, rooms):
        log.info("Generating entrances...")
        fig, ax = plt.subplots()
        ax.stackplot(x, ys, labels=rooms)
        ax.legend(loc='upper left', prop={'size': 4})
        ax.xaxis.set_major_locator(PdfGenerator.hours)
        ax.xaxis.set_major_formatter(PdfGenerator.hours_fmt)
        ax.xaxis.set_minor_locator(PdfGenerator.ten_minutes)
        ax.set_xlabel('Time (PT)')
        ax.set_ylabel('Users Seen For First Time (Stacked, Cumulative)')
        ax.grid(True)
        fig.autofmt_xdate()
        self.pdf.savefig(fig)
        return self

    def exits(self, x, ys, rooms):
        log.info("Generating exits...")
        fig, ax = plt.subplots()
        ax.stackplot(x, ys, labels=rooms)
        ax.legend(loc='upper left', prop={'size': 4})
        ax.xaxis.set_major_locator(PdfGenerator.hours)
        ax.xaxis.set_major_formatter(PdfGenerator.hours_fmt)
        ax.xaxis.set_minor_locator(PdfGenerator.ten_minutes)
        ax.set_xlabel('Time (PT)')
        ax.set_ylabel('Users Seen For Last Time (Stacked, Cumulative)')
        ax.grid(True)
        fig.autofmt_xdate()
        self.pdf.savefig(fig)
        return self

    def finish(self):
        log.info("Saving...")
        self.pdf.close()


def main():
    parser = ZoomReportParser(sys.argv[1:])
    rooms = parser.rooms()
    x, y_rooms, y_all = parser.attendances()
    stay_durations = parser.stay_durations()
    rooms_visited = parser.rooms_visited()
    all_visit_durations, visit_durations = parser.visit_durations()
    moves, enters, exits = parser.moves()

    generator = PdfGenerator('analytics.pdf')
    generator \
        .start() \
        .attendances(x, y_rooms, y_all, rooms) \
        .stay_durations(stay_durations) \
        .rooms_visited(rooms_visited, rooms) \
        .visit_durations(all_visit_durations, visit_durations, rooms) \
        .moves(moves) \
        .enters(x, enters, rooms) \
        .exits(x, exits, rooms) \
        .finish()


if __name__ == "__main__":
    main()
