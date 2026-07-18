"""Process-wide curriculum/item fixtures shared by the diagnostic routers.

Only one demo lesson exists in data/seeds/ today; loading it once here avoids
re-reading the fixture JSON per request and per router.
"""

from ailearn_diagnostic import load_curriculum, load_items

CURRICULUM = load_curriculum()
ITEMS = load_items()
