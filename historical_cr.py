import json
import matplotlib.pyplot as plt

with open("data_cr.json", "r") as file:
    crdata = json.loads(file.read())

x = list(crdata)
x.sort()

y1 = [float(crdata[k]["TCR"]) for k in x]
y2 = [float(crdata[k]["ECR"]) for k in x]
y3 = [float(crdata[k]["TITAN price"]) for k in x]
y4 = [1.0 if float(crdata[k]["IRON price"]) > 1.0 else None for k in x]
y5 = [1.0 if float(crdata[k]["IRON price"]) <= 1.0 else None for k in x]


fig, ax = plt.subplots()

ax.plot(x, y1, label="TCR")
ax.plot(x, y2, label="ECR")
ax.set_xlabel("Time")
ax.set_ylabel("ECR/TCR")

ax2 = ax.twinx()
ax2.plot(x, y3, label="TITAN price", color="red")
ax2.set_ylabel("TITAN price, $")

ax3 = ax.twinx()
ax3.scatter(x, y4, label="IRON > $1", s=1, color="green")
ax3.scatter(x, y5, label="IRON <= $1", s=1, color="red")
ax3.set_ylim(ymin=0, ymax=60)
ax3.set_yticks([])

ax.set_xticks([x[0], x[-1]])
ax.set_xticklabels(["May 29", "June 17"])

fig.legend(loc="upper left", bbox_to_anchor=(0, 1), bbox_transform=ax.transAxes)

plt.show()
