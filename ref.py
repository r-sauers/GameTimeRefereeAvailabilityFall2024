import sys
import os
import json
import csv
import pyperclip
import pandas as pd
import regex as re


def getch():
    import sys, termios, tty

    fd = sys.stdin.fileno()
    orig = termios.tcgetattr(fd)

    try:
        tty.setcbreak(fd)  # or tty.setraw(fd) if you prefer raw mode's behavior.
        return sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSAFLUSH, orig)


referee_field_name = "Interested Referees"


def get_games_from_file(file_name):
    with open(file_name, 'r') as games_file:
        games = {}
        reader = csv.DictReader(games_file, delimiter=',')
        fieldnames = reader.fieldnames
        for game in reader:
            games[game["Game ID"]] = game
            refs = game.get(referee_field_name)
            if not refs:
                refs = []
            else:
                refs = refs.split("; ")
            game["_refs"] = refs
    return (games, fieldnames)


def assign_referee_from_json_file(filepath, games, mark_used):
    with open(filepath, "r") as f:
        try:
            data_str = f.read()
            data_obj = json.loads(data_str)
        except Exception as e:
            print("Failed to parse: ./" + filepath)
            print(e)
        else:
            if mark_used:
                os.rename(filepath, filepath + ".used")
            referee_name = data_obj["name"]
            referee_availability = data_obj["availabileFor"]
            for game in referee_availability:
                if referee_name not in games[game]["_refs"]:
                    games[game]["_refs"].append(referee_name)


def assign_referees_from_json_files(json_dir, games, mark_used, use_all_json):
    with os.scandir(json_dir) as json_files:
        for json_file in json_files:

            if not use_all_json and json_file.name.endswith(".used"):
                continue

            filepath = "./" + json_dir + json_file.name
            assign_referee_from_json_file(filepath, games, mark_used)


def write_games_to_csv(file_name, fieldnames, games):
    with open(file_name, 'w') as games_file:

        if referee_field_name not in fieldnames:
            fieldnames.append(referee_field_name)

        writer = csv.dictwriter(games_file, fieldnames,
                                delimiter=',', extrasaction='ignore')
        writer.writeheader()
        for game in games.values():
            game[referee_field_name] = "; ".join(game["_refs"])
            writer.writerow(game)


def print_games_as_csv(fieldnames, games):

    if referee_field_name not in fieldnames:
        fieldnames.append(referee_field_name)

    writer = csv.DictWriter(sys.stdout, fieldnames,
                            delimiter=',', extrasaction='ignore')
    writer.writeheader()
    for game in games.values():
        game[referee_field_name] = "; ".join(game["_refs"])
        writer.writerow(game)

    print("\n", file=sys.stdout)


def print_usage(program_name):
    print(f"""
Usage: $python3 {program_name} [Primary Options] [flags]

Primary Options:
-h --help   Prints usage.

-a <games_csv> <json_dir>,
--assign-referees <games_csv> <json_dir>

    Given a csv of games, and a directory of json files describing referee
    availability, modifies the csv to include the given referee availability.
    NOTE: csv file must be comma delimiter and have a 'Game ID' header.

    -o <filename>       Specify output file (by default edits in place).
    -p                  Prints resulting csv instead of writing to a file.
    -m                  Marks availaility files as "used" by appending ".used"
                        to the file name. (default is no marks)
    -s                  Assign from a single json file instead of a directory.
    -a                  Use all json files, including those marked with ".used"

-app-data --generate-application-data   Generates js code for calendar data from csv files.
    --august <august_file>
    --september <september_file>
    --october <october_file>
    --any <game_file>
    -excel, -e                      Use this flag to use excel files.

-c, --create-csv <filename>        Create a games csv file from monthly calendar files.
    --august <august_file>
    --september <september_file>
    --october <october_file>
    -excel, -e                      Use this flag to use excel files.
    -p                              Use this flag to print result instead of writing to a file.

-m, --merge-csv <file1> <file2>         Performs a union on two csv files such that
                                    all games and availability are represented
                                    in file2.
    -o <filename>       Specify the output file (by default, writes to file2)
    -p                  Use this flag to print result instead of writing to a file.

Example:

""", file=sys.stderr)


COL_WIDTH = 40
MAX_NAME_WIDTH = COL_WIDTH-3
PADDING = 3
selected = {"col": 0, "row": 0}


def draw_headers(column, filename, problems):
    text = f"{filename} Headers:"
    loc = f"\033[5;{COL_WIDTH*column + PADDING*(column-1) + ((COL_WIDTH - len(text)) // 2)}H"
    print(f"{loc}{text}")
    for i, header in enumerate(problems):
        draw_header(header, column, i)


def draw_header(header, column, index):

    col = ""
    end_col = "\033[0m"
    if selected["col"] == column and selected["row"] == index:
        col = "\033[42m"
    if header["deleted"]:
        col += "\033[31m"
    loc = f"\033[{6+index};{COL_WIDTH*column + PADDING*(column-1)}H"

    index_str = header["index"]
    name_str = header["name"]
    if len(name_str) > MAX_NAME_WIDTH:
        name_str = name_str[:MAX_NAME_WIDTH-3] + "..."

    print(f"{loc} {col}{index_str}. {name_str}{end_col}")


def input_error(program_name, error):
    print("Error: " + error, file=sys.stderr)
    print_usage(program_name)
    exit(1)


def error(error, code=2):
    print(error, file=sys.stderr)
    exit(code)


def parse_time(time):
    time_str = time.strftime("%I:%M %p")
    if time_str[0] == "0":
        time_str = time_str[1:]
    return time_str


# Generates application game data and copies to clipboard.
def generate_application_data(month_data=None, any_data=None, use_excel=False):

    content = ""
    csv_content = ""

    months = {}
    if month_data is not None:
        months = month_data

        for month in months.keys():
            month_file = months[month]
            if use_excel:
                read_file = pd.read_excel(
                    month_file,
                    converters={"Time": lambda time: parse_time(time)}
                )
                csv_content = read_file.to_csv(
                    index=False, date_format="%m/%d/%Y")
            else:
                with open(month_file, "r") as f:
                    csv_content = f.read()

            if csv_content != "":

                csv_lines = csv_content.split('\n')
                quotes = 0
                months[month] = ""
                for line in csv_lines:
                    quotes += line.count('"')
                    line = line.replace('"', '')
                    if line != "":
                        if (quotes % 2) == 0:
                            months[month] += line + '\n'
                        else:
                            months[month] += line

    if any_data is not None:

        if use_excel:
            read_file = pd.read_excel(
                any_data,
                converters={"Time": lambda time: parse_time(time)}
            )
            csv_content = read_file.to_csv(
                index=False, date_format="%m/%d/%Y")
        else:
            with open(any_data, "r") as f:
                csv_content = f.read()

        if csv_content != "":

            csv_lines = csv_content.split('\n')
            quotes = 0
            parsed_line = ""
            for line in csv_lines[1:]:
                quotes += line.count('"')
                line = line.replace('"', '')
                if line != "":
                    if (quotes % 2) == 0:
                        parsed_line = parsed_line + line
                        month_abbrev = parsed_line.split(",")[1].split("/")[0]
                        month = ""
                        if month_abbrev in ["09", "9"]:
                            month = "september"
                        elif month_abbrev in ["08", "8"]:
                            month = "august"
                        elif month_abbrev in ["10", "10"]:
                            month = "october"
                        else:
                            print("Error: couldn't parse month:")
                            print(parsed_line.split(",")[1])
                            parsed_line = ""
                            continue

                        if month in months:
                            months[month] += parsed_line + '\n'
                        else:
                            months[month] = parsed_line + '\n'
                        parsed_line = ""
                    else:
                        parsed_line += line

    for month in months.keys():
        content += f"\t\tconst {month} = \n`"
        content += months[month]
        content = content[:-1]
        content += "`\n"

    content += "\n\t\tconst calendars = {\n"
    for month in months.keys():
        content += f"\t\t\t\"{month}\": {month},\n"
    content += "\t\t}\n"
    pyperclip.copy(content)
    return True


def create_csv(filename, months, options):
    
    csv_string = ""
    headers_added = False
    headers = []

    for month in months.keys():
        month_file = months[month]

        csv_content = ""
        file_headers = []

        if options["use_excel"]:
            read_file = pd.read_excel(month_file)
            file_headers = list(read_file.columns)
            csv_content = read_file.to_csv(index=False, header=False, date_format="%m/%d/%Y")
        else:
            with open(month_file, "r") as f:
                file_headers = f.readline().split(",")
                csv_content = f.read()

        if csv_content != "":
            if not headers_added:
                headers = file_headers
                csv_string += ",".join(headers)
                csv_string += "\n"
                headers_added = True
            elif headers != file_headers:
                error("CSV header mismatch.")

            csv_string += csv_content
        else:
            error("no csv content found")

        if options["print_only"]:
            print(csv_string)
        else:
            with open(filename, "w") as f:
                f.write(csv_string)
                print(f"Wrote {month_file} to: " + filename)


# m - merge
# s - split
# q - quit
# d - default
# x - delete
# r - rename
# t - toggle name
# Shift-k - re-order up
# Shift-j - re-order down

class Header:

    def __init__(self, header1_name, header1_id, header2_name, header2_id):
        self.header1_name = header1_name
        self.header2_name = header2_name
        self.new_name = None
        self.name_toggle = 0
        self.names = ["header1"]

        self.header1_id = header1_id
        self.header2_id = header2_id

        self.default = None
        self.is_deleted = False

    @staticmethod
    def fromFile1(header_name, header_id):
        return Header(header_name, header_id, None, None)

    @staticmethod
    def fromFile2(header_name, header_id):
        return Header(None, None, header_name, header_id)

    @staticmethod
    def fromMerged(header1, header2):
        header = header1.copy()
        if header1.header1_name is not None and header1.header2_name is not None:
            return (False, "Header being merged into is already complete")
        elif header2.header1_name is not None and header2.header2_name is not None:
            return (False, "Header being merged is already complete")
        elif header1.header1_name is not None and header2.header1_name is not None:
            return (False, "Cannot merge headers from the same file")
        elif header1.header2_name is not None and header2.header2_name is not None:
            return (False, "Cannot merge headers from the same file")
        elif header1.header1_name is None:
            header.header1_name = header2.header1_name
            header.header1_id = header2.header1_id
            header.names.insert(0, "header1")
            return (True, header)
        elif header1.header2_name is None:
            header.header2_name = header2.header2_name
            header.header2_id = header2.header2_id
            header.names.insert(1, "header2")
            return (True, header)
        else:
            error("Header name state corrupted.")

    def split(self):

        if self.header1_name is None or self.header2_name is None:
            return (False, "Cannot split a header without a match.")

        header = self.copy()

        self.header2_name = None
        self.header2_id = None
        self.names.remove("header2")
        self.name_toggle = self.names.index("header1")
        header.header1_name = None
        header.header1_id = None
        header.names.remove("header1")
        header.name_toggle = header.names.index("header2")

        return (True, header)

    def makeDefault(self, default_value):
        self.default = default_value

    def toggleDelete(self):
        self.is_deleted = not self.is_deleted

    def rename(self, name):
        self.new_name = name
        self.names.append("new")
        self.name_toggle = self.names.index("new")

    def toggleName(self):
        self.name_toggle += 1
        self.name_toggle %= len(self.names)

    def get_name(self):
        name_selected = self.names[self.name_toggle]
        if name_selected == "new":
            return self.new_name
        elif name_selected == "header2":
            return self.header2_name
        else:
            return self.header1_name

    def get_first_header(self):
        if self.header1_name is not None:
            return f"{self.header1_id}. {self.header1_name}"
        else:
            return None

    def get_second_header(self):
        if self.header2_name is not None:
            return f"{self.header2_id}. {self.header2_name}"
        else:
            return None

    def is_deleted(self):
        returnself.is_deleted

    def is_valid(self):
        if self.header1_name is not None and self.header2_name is not None:
            return True

        if self.default is not None:
            return True

        if self.is_deleted:
            return True

        return False

    def is_dup(self, other):
        return self.get_name() == other.get_name()

    def copy(self):
        header = Header(self.header1_name, self.header1_id, self.header2_name, self.header2_id)
        header.default = self.default
        header.new_name = self.new_name
        header.names = self.names
        header.name_toggle = self.name_toggle
        header.is_deleted = self.is_deleted
        return header


class TableFormatter:

    instance = None

    def get_instance():
        if instance is not None:
            instance = TableFormatter()
        return instance

    def __init__(self):
        self.width = 80
        self.padding = self.width // 10
        if self.padding < 2:
            self.padding = 2
        self.col_width = (self.width - self.padding) // 2
        self.offset = (0, 0)

    def set_offset(self, offset):
        self.offset = offset

    def get_loc(self, x, y, align="left", text=""):
        text_len = len(text)
        if text_len > self.col_width:
            text_len = self.col_width
        new_x = self.col_width * x + self.padding * (x-1)
        new_y = 0
        if align == "center":
            new_x += ((col_width - text_len) // 2)
        elif align == "right":
            new_x = col_width - text_len
        x += offset[0]
        y += offset[0]

    def reformat_text(self, text):
        text_len = len(text)
        if text_len > self.col_width:
            return text[:self.col_width-3] + "..."
        return text


class Cursor:

    instance = None

    def get_instance():
        if instance is None:
            instance = Cursor(1, 1)
        return instance

    def __init__(self, x, y):
        self.x = x
        self.y = y
        print(f"\033[{x};{y}H")

    def set_x(self, x, move_cursor=True):
        self.x = x
        if move_cursor:
            print(f"\033[{x};{self.y}H")

    def set_y(self, y, move_cursor=True):
        self.y = y
        if move_cursor:
            print(f"\033[{self.x};{y}H")

    def set_cursor(self, x, y, move_cursor=True):
        self.x = x
        self.y = y
        if move_cursor:
            print(f"\033[{x};{y}H")

    def move_cursor(self, delta_x, delta_y, move_cursor=True):
        self.x += delta_x
        if delta_x < 0:
            if move_cursor:
                print(f"\033[{-delta_x}C", end="")
        elif delta_x > 0:
            if move_cursor:
                print(f"\033[{delta_x}D", end="")
        self.y += delta_y
        if delta_y < 0:
            if move_cursor:
                print(f"\033[{-delta_y}A", end="")
        elif delta_y > 0:
            if move_cursor:
                print(f"\033[{delta_y}B", end="")

    def move_line(self, delta_y, move_cursor=True):
        self.y += delta_y
        self.x = 1
        if delta_y < 0:
            if move_cursor:
                print(f"\033[{-delta_y}E", end="")
        elif delta_y > 0:
            if move_cursor:
                print(f"\033[{delta_y}F", end="")


class Screen:

    instance = None

    def get_instance():
        if instance is None:
            instance = Screen()
        return instance

    def __init__(self):
        self.cursor: Cursor = Cursor.get_instance()

    def erase_screen(self):
        print(f"\033[2J", end="")
        self.cursor.set_cursor(1, 1)

    def erase_screen_before(self):
        print(f"\033[1J", end="")

    def erase_screen_after(self):
        print(f"\033[0J", end="")

    def erase_line(self):
        print(f"\033[2K", end="")
        self.cursor.set_x(1)

    def erase_line_after(self):
        print(f"\033[0K", end="")

    def erase_line_before(self):
        print(f"\033[1K", end="")


class HeaderGUI:

    def __init__(self, header, index, width):
        self.header: Header = header
        self.width = width
        self.index = index

    def set_index(self, index):
        self.index = index

    def get_index(self, index):
        return self.index

    def __clear_line(self):
        cursor: Cursor = Cursor.get_instance()
        screen: Screen = Screen.get_instance()
        tf: TableFormatter = TableFormatter.get_instance()

        x, y = tf.get_loc(1, self.index)
        cursor.set_cursor(x, y)
        screen.erase_line()
        cursor.set_cursor(x, y)

    def display(self):
        cursor: Cursor = Cursor.get_instance()
        screen: Screen = Screen.get_instance()
        tf: TableFormatter = TableFormatter.get_instance()

        x, y = tf.get_loc(1, self.index)
        cursor.set_cursor(x, y)
        screen.erase_line()
        cursor.set_cursor(x, y)

        name = self.header.get_name()
        first_name = self.header.get_first_header()
        second_name = self.header.get_second_header()
        default = self.header.get_default()

        header1_exists = first_name is not None
        header2_exists = second_name is not None

        both_headers_exist = header1_exists and header2_exists
        highlight_first = name == first_name
        highlight_second = name == second_name
        display_renamed = name != first_name and name != second_name

        has_default = default is not None

        if header1_exists and highlight_first:
            print(first_name)
        elif header1_exists and highlight_second:
            print(first_name)
        elif header1_exists:
            print(new_name)
        elif has_default:
            print(f"Default: {default}")
        else:
            print("None")

        x, y = tf.get_loc(2, self.index)
        cursor.set_cursor(x, y)

        if header2_exists and highlight_second:
            print(second_name)
        elif header2_exists and highlight_first:
            print(second_name)
        elif header1_exists:
            print("(Renamed)")
        elif has_default:
            print(f"Default: {default}")
        else:
            print("None")

    def rename(self):
        self.__clear_line()

        pass

    def makeDefault(self):
        pass




class HeadersGUI:

    def __init__(self, width, filename1, filename2):
        self.screen = Screen.get_instance()
        self.cursor = self.screen.cursor
        self.headers = []
        self.primary_selection = 0
        self.secondary_selection = None
        self.filename1 = filename1
        self.filename2 = filename2
        self.instructions_height = 0

    def print_instructions(self):
        print(
            "Header Mismatch:\nYou must manually resolve this mismatch. Press 'q' at any time to cancel the merge.")
        print(
            "The following is a list of headers that do not match between the two files:\n")
        self.cursor.move_line(4, False)

    def add_header(self, header_name, header_id, file_num):
        if file_num == 1:
            pass
        elif file_num == 2:
            pass
        else:
            raise Exception("Invalid file_num")

    def __display_filename(self, filename, file_num):
        tf: TableFormatter = TableFormatter.get_instance()
        text = f"{filename} Headers:"
        text = tf.reformat_text(text)
        x, y = tf.get_loc(file_num, 0, align="center", text=text)
        self.cursor.set_cursor(x, y)
        print(f"{loc}{text}")
        self.cursor.move_line(1, False)

    def __adjust_header_height(self, delta_x, delta_y):
        for header in headers:
            x, y = header.get_loc()
            header.set_loc((x + delta_x, y + delta_y))

    def display_all(self):
        self.screen.erase_screen()
        self.print_instructions()

        self.__display_filename(self.filename1, 1)
        self.cursor.move_line(-1)
        self.__display_filename(self.filename2, 2)

        tf: TableFormatter = TableFormatter.get_instance()
        tf.set_offset((0, self.cursor.y))

        for header in headers:
            header.display()

    def handle_keypress(self):
        pass

    def run(self):
        self.display_all()
        pass



def merge_csv_files(file1, file2, options):
    (games1, headers1) = get_games_from_file(file1)
    (games2, headers2) = get_games_from_file(file2)

    final_headers = []
    problems1 = []
    problems2 = []
    for index, header in enumerate(headers1):
        matches = []
        match_index = 0
        loop = True
        while loop:
            try:
                match_index = headers2.index(header, match_index)
                matches.append(match_index)
                match_index += 1
            except ValueError as err:
                loop = False

        is_unique = headers1.count(header) == 1
        has_unique_match = len(matches) == 1

        if not is_unique or not has_unique_match:
            problems1.append({
                "name": header,
                "original_name": header,
                "index": index,
                "duplicate": not is_unique,
                "problem_resolved": False,
                "original": True,
                "deleted": False,
            })
            for match in matches:
                headers2[match] = None
                problems2.append({
                    "name": header,
                    "original_name": header,
                    "index": match,
                    "duplicate": has_unique_match,
                    "problem_resolved": False,
                    "original": True,
                    "deleted": False,
                })
        else:
            final_headers.append(headers2.pop(matches[0]))
            headers2.insert(matches[0], None)

    for index, header in enumerate(headers2):
        if header is None:
            continue

        is_unique = headers2.count(header) == 1
        problems2.append({
            "name": header,
            "original_name": header,
            "index": index,
            "duplicate": not is_unique,
            "problem_resolved": False,
            "original": True,
            "deleted": False,
        })

    if len(problems1) > 0 or len(problems2 > 0):


        print(
            "\033[2J\033[1;1HHeader Mismatch:\nYou must manually resolve this mismatch. Press 'q' at any time to cancel the merge.")
        print(
            "The following is a list of headers that do not match between the two files:\n")

        draw_headers(0, file1, problems1)
        draw_headers(1, file2, problems2)
        problems = [
            problems1,
            problems2
        ]
        char = ""
        while char != "q":
            char = getch()
            header = problems[selected["col"]][selected["row"]]
            if char == "h" or char == "l":
                selected["col"] += 1
                selected["col"] %= 2
                if selected["row"] > len(problems[selected["col"]]):
                    selected["row"] = len(problems[selected["col"]]) - 1
            elif char == "j":
                selected["row"] += 1
                selected["row"] %= len(problems[selected["col"]]) - 1
            elif char == "k":
                selected["row"] += len(problems[selected["col"]]) - 1
                selected["row"] %= len(problems[selected["col"]])
            # delete
            elif char == "x":
                header["deleted"] = not header["deleted"]
            # keep
            elif char == "k":
                other_col = (selected["col"] + 1) % 2
                default_header = {
                    "name": header["name"],
                    "original_name": header["name"],
                    "index": None,
                    "duplicate": False,
                    "problem_resolved": False,
                    "default": "",
                    "original": False,
                    "deleted": False,
                }
                problems[other_col].insert(selected["row"], default_header)
                header["problem_resolved"] = True
                draw_headers(0, file1, problems1)
                draw_headers(1, file2, problems2)

                print("")
                default_header["default"] = input()
                
            # merge
            elif char == "m":
                pass
            # rename
            elif char == "r":
                pass



            draw_headers(0, file1, problems1)
            draw_headers(1, file2, problems2)

        error("Header mismatch.")

    for gameID in games1.keys():
        if games2[gameID]:
            key1 = games1[gameID].keys()
            key1.remove("_refs")
            for key in key1:
                if games1[gameID][key] != games2[gameID][key]:
                    error("Field mismatch")

            refs1 = games1[gameID]["_refs"]
            refs2 = games2[gameID]["_refs"]
            for ref in refs1:
                if ref not in refs2:
                    refs2.append(ref)
        else:
            games2[gameID] = games1[gameID]

    if print_only:
        print_games_as_csv(headers2, games2)
    else:
        write_games_to_csv(output_file, headers2, games2)
        print("Wrote games to: " + output_file)


if __name__ == "__main__":

    program_name = sys.argv.pop(0)

    if len(sys.argv) == 0:
        input_error(program_name, "No arguments given.")

    command = sys.argv.pop(0)
    if (command == "-h" or command == "--help"):
        print_usage(program_name)
        exit(0)
    elif (command == "-a" or command == "assign-referees") and len(sys.argv) >= 2:

        games_csv = sys.argv.pop(0)
        json_dir = sys.argv.pop(0)
        output_file = games_csv  # inline file editing by default
        print_only = False
        mark_used = False
        use_all_json = False  # use all json files including ".used" files
        single_file_mode = False

        while (len(sys.argv) > 0):
            options = sys.argv.pop(0)
            if options[0] != "-":
                input_error(program_name, "Unrecognized flag.")
                continue
            elif options == "-o":
                if len(sys.argv) < 1:
                    input_error(program_name, "No filename given for -o flag.")
                else:
                    output_file = sys.argv.pop(0)
            else:
                for c in options[1:]:
                    if (c == "p"):
                        print_only = True
                    elif (c == "m"):
                        mark_used = True
                    elif (c == "s"):
                        single_file_mode = True
                    elif (c == "a"):
                        use_all_json = True
                    else:
                        input_error(program_name, "Unrecognized flag.")

        (games, fieldnames) = get_games_from_file(games_csv)

        if single_file_mode:
            assign_referee_from_json_file(json_dir, games, mark_used)
        else:
            assign_referees_from_json_files(
                json_dir, games, mark_used, use_all_json)

        if print_only:
            print_games_as_csv(fieldnames, games)
        else:
            write_games_to_csv(output_file, fieldnames, games)

    elif (command == "-app-data" or command == "--generate-application-data") and len(sys.argv) >= 2:

        months = {}
        any_month = {}
        use_excel = False

        if "--excel" in sys.argv:
            use_excel = True
            sys.argv.remove("--excel")

        if "-e" in sys.argv:
            use_excel = True
            sys.argv.remove("-e")

        while len(sys.argv) >= 2:
            month_flag = sys.argv.pop(0)
            month_file = sys.argv.pop(0)

            if month_flag in ["--august", "--september", "--october"]:
                months[month_flag[2:]] = month_file
            elif month_flag == "--any":
                any_month = month_file
            else:
                print(
                    f"Unrecognized month flag: {month_flag}", file=sys.stderr)

        if not months:
            months = None
        if not any_month:
            any_month = None
        if generate_application_data(months, any_month, use_excel):
            print("Successfully copied to clipboard!")

    elif (command == "-c" or command == "--create-csv") and len(sys.argv) >= 1:
        months = {}
        options = {
            print_only: False,
            use_excel: False,
        }
        filename = sys.argv.pop(0)

        if "--excel" in sys.argv:
            options["use_excel"] = True
            sys.argv.remove("--excel")

        if "-e" in sys.argv:
            options["use_excel"] = True
            sys.argv.remove("-e")

        if "-p" in sys.argv:
            options["print_only"] = True
            sys.argv.remove("-p")

        while len(sys.argv) >= 2:
            month_flag = sys.argv.pop(0)
            month_file = sys.argv.pop(0)

            if month_flag in ["--august", "--september", "--october"]:
                months[month_flag[2:]] = month_file
            else:
                print(
                    f"Unrecognized month flag: {month_flag}", file=sys.stderr)

        create_csv(filename, months, options)

    elif (command == "-m" or command == "--merge") and len(sys.argv) >= 2:

        file1 = sys.argv.pop(0)
        file2 = sys.argv.pop(0)
        options = {
            output_file: file2,
            print_only: False
        }

        if len(sys.argv) == 1 and "-p" in sys.argv:
            options["print_only"] = True
            sys.argv.remove("-p")
        elif len(sys.argv) == 2 and sys.argv[0] == "-o":
            filename = sys.argv[1]
            options["output_file"] = filename
        
        merge_csv_files(file1, file2, options)

        


    else:
        print_usage(program_name)
        exit(1)

    exit(0)
