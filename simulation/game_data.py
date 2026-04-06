from dataclasses import dataclass, replace
from typing import Callable


@dataclass(frozen=True)
class Config:
    starting_modules: int = 5
    starting_knowledge: int = 0
    starting_rapport: int = 0
    clock_max: int = 10
    clock_base_tick: int = 1
    clock_jitter_chance: float = 0.5
    clock_jitter_amount: int = 1
    clock_reduction_base: int = 1
    clock_reduction_max: int = 2
    rapport_clock_scale: float = 0.5
    knowledge_threshold: int = 8
    fix_cost: int = 2
    journey_stops: int = 5
    max_raw_score: int = 103
    reroll_multiplier: float = 0.92
    knowledge_reward_bonus: int = 0
    consumable_reward_bonus: int = 0
    rough_touch: bool = False
    stubborn: bool = False
    practiced: bool = False
    light_foot: bool = False
    tunnel_nerves: bool = False
    distracted: bool = False
    narrow_focus: bool = False
    ending_correction: int = 40
    ending_destruction: int = 20
    ending_clock_failure: int = 0
    per_community_helped: int = 8
    per_rapport_point: int = 5
    per_module_remaining: int = 4
    per_module_remaining_surplus: int = 2
    per_knowledge_over_threshold: int = 3
    per_knowledge_over_threshold_surplus: int = 1
    per_clock_segment_remaining: int = 3


DEFAULT_CONFIG = Config()


@dataclass(frozen=True)
class EventChoice:
    label: str
    knowledge_change: int = 0
    module_change: int = 0
    clock_change: int = 0
    community_effect: str = "none"
    knowledge_gate: int = 0
    rapport_gate: int = 0


@dataclass(frozen=True)
class Event:
    id: str
    category: str
    choices: list[EventChoice]
    has_found_document: bool = False


TraitDef = tuple[str, str, str, Callable[[Config], Config]]

POSITIVE_TRAITS: list[TraitDef] = [
    (
        "P1",
        "Well-Supplied",
        "starting resources",
        lambda c: replace(c, starting_modules=c.starting_modules + 2),
    ),
    (
        "P2",
        "Quick Study",
        "knowledge income",
        lambda c: replace(c, knowledge_reward_bonus=c.knowledge_reward_bonus + 1),
    ),
    (
        "P3",
        "Networked",
        "social baseline",
        lambda c: replace(c, starting_rapport=c.starting_rapport + 1),
    ),
    (
        "P4",
        "Steady Hand",
        "clock variance",
        lambda c: replace(c, clock_jitter_chance=c.clock_jitter_chance * 0.5),
    ),
    (
        "P5",
        "Field Expedient",
        "reward efficiency",
        lambda c: replace(c, consumable_reward_bonus=c.consumable_reward_bonus + 1),
    ),
    (
        "P6",
        "Clear-Headed",
        "competence gates",
        lambda c: replace(c, knowledge_threshold=c.knowledge_threshold - 2),
    ),
    ("P7", "Light Foot", "transit safety", lambda c: replace(c, light_foot=True)),
    ("P8", "Practiced", "spending efficiency", lambda c: replace(c, practiced=True)),
]

NEGATIVE_TRAITS: list[TraitDef] = [
    (
        "N1",
        "Tunnel Nerves",
        "approach pressure",
        lambda c: replace(c, tunnel_nerves=True),
    ),
    ("N2", "Rough Touch", "community costs", lambda c: replace(c, rough_touch=True)),
    ("N3", "Narrow Focus", "clock recovery", lambda c: replace(c, narrow_focus=True)),
    ("N4", "Distracted", "passive knowledge", lambda c: replace(c, distracted=True)),
    (
        "N5",
        "Lone Wolf",
        "social scaling",
        lambda c: replace(c, rapport_clock_scale=c.rapport_clock_scale * 0.5),
    ),
    (
        "N6",
        "Fragile Kit",
        "endgame cost",
        lambda c: replace(c, fix_cost=c.fix_cost + 1),
    ),
    (
        "N7",
        "Exhausted",
        "clock variance",
        lambda c: replace(c, clock_jitter_chance=1.0),
    ),
    ("N8", "Stubborn", "choice restriction", lambda c: replace(c, stubborn=True)),
]

COMMUNITY_POOL: list[Event] = [
    Event(
        "CE-01",
        "community",
        [
            EventChoice(
                "A", knowledge_change=1, module_change=-2, community_effect="helped"
            ),
            EventChoice(
                "B", knowledge_change=1, module_change=-1, community_effect="helped"
            ),
            EventChoice("C", knowledge_change=2, community_effect="ignored"),
        ],
        has_found_document=True,
    ),
    Event(
        "CE-02",
        "community",
        [
            EventChoice(
                "A", module_change=-1, community_effect="helped", knowledge_gate=3
            ),
            EventChoice("B", module_change=-2, community_effect="helped"),
            EventChoice("C", knowledge_change=1, community_effect="ignored"),
        ],
    ),
    Event(
        "CE-03",
        "community",
        [
            EventChoice(
                "A", knowledge_change=2, module_change=-1, community_effect="helped"
            ),
            EventChoice("B", knowledge_change=2, community_effect="ignored"),
            EventChoice("C", community_effect="ignored"),
        ],
    ),
    Event(
        "CE-04",
        "community",
        [
            EventChoice(
                "A", knowledge_change=3, module_change=-1, community_effect="helped"
            ),
            EventChoice("B", knowledge_change=2, community_effect="ignored"),
            EventChoice("C", community_effect="ignored"),
        ],
        has_found_document=True,
    ),
    Event(
        "CE-05",
        "community",
        [
            EventChoice("A", module_change=-1, community_effect="helped"),
            EventChoice("B", knowledge_change=1, community_effect="harmed"),
            EventChoice(
                "C",
                module_change=-1,
                clock_change=-1,
                community_effect="helped",
                knowledge_gate=4,
            ),
        ],
    ),
]

TRANSIT_POOL: list[Event] = [
    Event(
        "TE-01",
        "transit",
        [
            EventChoice("A", module_change=1, community_effect="harmed"),
            EventChoice("B", module_change=-1),
            EventChoice("C", clock_change=1),
        ],
    ),
    Event(
        "TE-02",
        "transit",
        [
            EventChoice("A", knowledge_change=1, module_change=1),
            EventChoice("B", module_change=-1),
            EventChoice("C", knowledge_change=1, clock_change=1),
        ],
        has_found_document=True,
    ),
    Event(
        "TE-03",
        "transit",
        [
            EventChoice("A", module_change=2, community_effect="harmed"),
            EventChoice("B", knowledge_change=1, module_change=1, knowledge_gate=3),
            EventChoice("C", knowledge_change=2),
        ],
    ),
    Event(
        "TE-04",
        "transit",
        [
            EventChoice("A", knowledge_change=3, module_change=-1),
            EventChoice("B", knowledge_change=2, clock_change=1),
            EventChoice("C", knowledge_change=1),
        ],
        has_found_document=True,
    ),
]

APPROACH_POOL: list[Event] = [
    Event(
        "AE-01",
        "approach",
        [
            EventChoice("A", knowledge_change=2, module_change=1, rapport_gate=2),
            EventChoice("B", knowledge_change=2),
            EventChoice("C", clock_change=1),
        ],
    ),
    Event(
        "AE-02",
        "approach",
        [
            EventChoice("A", knowledge_change=1, knowledge_gate=5),
            EventChoice("B", module_change=-2),
            EventChoice("C", clock_change=2),
        ],
    ),
    Event(
        "AE-03",
        "approach",
        [
            EventChoice("A", knowledge_change=3, knowledge_gate=4),
            EventChoice("B", module_change=-1, clock_change=-1),
            EventChoice("C", knowledge_change=1),
        ],
        has_found_document=True,
    ),
]
